import AppKit
import WebKit
import Darwin
import Foundation

final class Monitor {
    private var previous: (user: UInt64, system: UInt64, idle: UInt64, nice: UInt64)?

    func cpuPercent() -> Double {
        var info = host_cpu_load_info_data_t()
        var count = mach_msg_type_number_t(MemoryLayout<host_cpu_load_info_data_t>.size / MemoryLayout<integer_t>.size)
        let result = withUnsafeMutablePointer(to: &info) { ptr in
            ptr.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, $0, &count)
            }
        }
        guard result == KERN_SUCCESS else { return 0 }
        let ticks = (user: UInt64(info.cpu_ticks.0), system: UInt64(info.cpu_ticks.1), idle: UInt64(info.cpu_ticks.2), nice: UInt64(info.cpu_ticks.3))
        defer { previous = ticks }
        guard let old = previous else { return 0 }
        let du = UInt32(truncatingIfNeeded: ticks.user) &- UInt32(truncatingIfNeeded: old.user)
        let ds = UInt32(truncatingIfNeeded: ticks.system) &- UInt32(truncatingIfNeeded: old.system)
        let di = UInt32(truncatingIfNeeded: ticks.idle) &- UInt32(truncatingIfNeeded: old.idle)
        let dn = UInt32(truncatingIfNeeded: ticks.nice) &- UInt32(truncatingIfNeeded: old.nice)
        let total = Double(du) + Double(ds) + Double(di) + Double(dn)
        return total > 0 ? min(100,max(0,100 * (1-Double(di)/total))) : 0
    }

    func ramPercent() -> Double {
        var stats = vm_statistics64_data_t()
        var count = mach_msg_type_number_t(MemoryLayout<vm_statistics64_data_t>.size / MemoryLayout<integer_t>.size)
        let result = withUnsafeMutablePointer(to: &stats) { ptr in
            ptr.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                host_statistics64(mach_host_self(), HOST_VM_INFO64, $0, &count)
            }
        }
        guard result == KERN_SUCCESS else { return 0 }
        var pageSize: vm_size_t = 0
        guard host_page_size(mach_host_self(), &pageSize) == KERN_SUCCESS else { return 0 }
        let usedPages = Double(stats.active_count) + Double(stats.wire_count) + Double(stats.compressor_page_count)
        let usedBytes = usedPages * Double(pageSize)
        return min(100,max(0,usedBytes / Double(ProcessInfo.processInfo.physicalMemory) * 100))
    }
}

final class ClearView: WKWebView {
    override var isOpaque: Bool { false }
    override func hitTest(_ point: NSPoint) -> NSView? { bounds.contains(point) ? self : nil }
    override func mouseDown(with event: NSEvent) { window?.performDrag(with: event) }
}

final class Controller: NSObject, NSApplicationDelegate, WKNavigationDelegate, NSWindowDelegate {
    private let monitor = Monitor()
    private var panel: NSPanel!
    private var webView: WKWebView!
    private var statusItem: NSStatusItem!
    private var ticker: Timer?
    private let cpuReading = NSMenuItem(title: "CPU: measuring…", action: nil, keyEquivalent: "")
    private let ramReading = NSMenuItem(title: "RAM usage: measuring…", action: nil, keyEquivalent: "")
    private var appReady = false
    private var hidden = false
    private var lastCpu: Double = 0
    private var lastRam: Double = 0
    private var mode = "max"
    private var sizeScale: CGFloat = {
        let stored = UserDefaults.standard.double(forKey: "companionSize")
        return stored >= 0.25 && stored <= 1.6 ? CGFloat(stored) : 1.0
    }()

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        makeOverlay()
        makeMenu()
        _ = monitor.cpuPercent()
        ticker = Timer(timeInterval: 1.0, repeats: true) { [weak self] _ in self?.updateMeasurements() }
        RunLoop.main.add(ticker!, forMode: .common)
        ticker?.tolerance = 0.15
        updateMeasurements()
    }
    func applicationWillTerminate(_ notification: Notification) { ticker?.invalidate() }

    private func overlaySize(for scale: CGFloat) -> NSSize {
        let frame = NSScreen.main?.visibleFrame ?? NSRect(x: 0,y: 0,width: 1200,height: 800)
        let base: CGFloat = min(680, max(460, frame.width * 0.39))
        let width: CGFloat = min(frame.width * 0.82, max(85, base * scale))
        let height = width * 1400 / 2400
        return NSSize(width: width, height: height)
    }

    private func positionPanel(animated: Bool = false) {
        let frame = NSScreen.main?.visibleFrame ?? NSRect(x: 0,y: 0,width: 1200,height: 800)
        let size = overlaySize(for: sizeScale)
        let screen = panel.screen?.visibleFrame ?? frame
        let origin = NSPoint(x: min(max(panel.frame.minX, screen.minX), screen.maxX - size.width),
                             y: min(max(panel.frame.minY, screen.minY), screen.maxY - size.height))
        let rect = NSRect(origin: origin, size: size)
        panel.setFrame(rect, display: true, animate: animated)
    }

    private func makeOverlay() {
        let size = overlaySize(for: sizeScale)
        let frame = NSScreen.main?.visibleFrame ?? NSRect(x: 0,y: 0,width: 1200,height: 800)
        var origin = NSPoint(x: frame.maxX - size.width - 25,y: frame.minY + 42)
        if UserDefaults.standard.object(forKey: "companionOriginX") != nil {
            let saved = NSPoint(x: UserDefaults.standard.double(forKey: "companionOriginX"),
                                y: UserDefaults.standard.double(forKey: "companionOriginY"))
            if let screen = NSScreen.screens.first(where: { $0.visibleFrame.contains(saved) }) {
                origin = NSPoint(x: min(saved.x, screen.visibleFrame.maxX - size.width),
                                 y: min(saved.y, screen.visibleFrame.maxY - size.height))
            }
        }
        panel = NSPanel(contentRect: NSRect(origin: origin,size: size),
                        styleMask: [.borderless,.nonactivatingPanel],backing: .buffered,defer: false)
        panel.backgroundColor = .clear
        panel.isOpaque = false
        panel.hasShadow = false
        panel.level = .floating
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.ignoresMouseEvents = false
        panel.delegate = self
        panel.collectionBehavior = [.canJoinAllSpaces,.fullScreenAuxiliary,.stationary]

        let configuration = WKWebViewConfiguration()
        configuration.userContentController.addUserScript(WKUserScript(
            source: "document.documentElement.classList.add('native');",
            injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        webView = ClearView(frame: NSRect(origin: .zero,size: panel.frame.size),configuration: configuration)
        webView.navigationDelegate = self
        webView.autoresizingMask = [.width,.height]
        webView.underPageBackgroundColor = .clear
        webView.setValue(false, forKey: "drawsBackground")
        if let file = Bundle.main.resourceURL?.appendingPathComponent("index.html") {
            webView.loadFileURL(file,allowingReadAccessTo: Bundle.main.resourceURL!)
        }
        panel.contentView = webView
        panel.orderFrontRegardless()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        appReady = true
        webView.evaluateJavaScript("window.setNative()", completionHandler: nil)
        webView.evaluateJavaScript("window.setMode('\(mode)')", completionHandler: nil)
        webView.evaluateJavaScript("window.setCompanionScale(\(Int(sizeScale * 100)))", completionHandler: nil)
        sendMetrics()
    }
    private func updateMeasurements() {
        lastCpu = monitor.cpuPercent()
        lastRam = monitor.ramPercent()
        updateStatus()
        sendMetrics()
    }
    private func sendMetrics() {
        guard appReady else { return }
        webView.evaluateJavaScript(String(format:"window.setNativeMetrics(%.2f, %.2f)",lastCpu,lastRam),completionHandler:nil)
    }

    func windowDidMove(_ notification: Notification) {
        UserDefaults.standard.set(panel.frame.minX, forKey: "companionOriginX")
        UserDefaults.standard.set(panel.frame.minY, forKey: "companionOriginY")
    }
    private func updateStatus() {
        let pressure = mode == "cpu" ? lastCpu : mode == "ram" ? lastRam : max(lastCpu, lastRam)
        statusItem.button?.title = "◉ \(Int(pressure.rounded()))%"
        statusItem.button?.toolTip = "HOT CPU · CPU \(Int(lastCpu.rounded()))% · RAM usage \(Int(lastRam.rounded()))% · Drag the companion to move it"
        cpuReading.title = "CPU: \(Int(lastCpu.rounded()))%"
        ramReading.title = "RAM usage: \(Int(lastRam.rounded()))%"
    }
    private func makeMenu() {
        statusItem = NSStatusBar.system.statusItem(withLength:NSStatusItem.variableLength)
        statusItem.button?.title = "◉"
        statusItem.button?.toolTip = "HOT CPU · Animated system load"
        let menu = NSMenu()
        let caption = NSMenuItem(title:"HOT CPU",action:nil,keyEquivalent:"")
        caption.isEnabled = false
        menu.addItem(caption)
        cpuReading.isEnabled = false
        ramReading.isEnabled = false
        menu.addItem(cpuReading)
        menu.addItem(ramReading)
        menu.addItem(NSMenuItem.separator())
        let max = NSMenuItem(title:"Higher of CPU / RAM",action:#selector(chooseMax),keyEquivalent:"")
        let cpu = NSMenuItem(title:"CPU only",action:#selector(chooseCPU),keyEquivalent:"")
        let ram = NSMenuItem(title:"RAM usage only",action:#selector(chooseRAM),keyEquivalent:"")
        [max,cpu,ram].forEach{ $0.target = self;menu.addItem($0) }
        menu.addItem(NSMenuItem.separator())
        let tiny = NSMenuItem(title:"Size · Tiny (25%)",action:#selector(sizeTiny),keyEquivalent:"")
        let small = NSMenuItem(title:"Size · Small (40%)",action:#selector(sizeSmall),keyEquivalent:"")
        let medium = NSMenuItem(title:"Size · Medium (65%)",action:#selector(sizeMedium),keyEquivalent:"")
        let normal = NSMenuItem(title:"Size · Normal (100%)",action:#selector(sizeNormal),keyEquivalent:"")
        let large = NSMenuItem(title:"Size · Large (140%)",action:#selector(sizeLarge),keyEquivalent:"")
        [tiny,small,medium,normal,large].forEach { $0.target = self; menu.addItem($0) }
        menu.addItem(NSMenuItem.separator())
        let toggle = NSMenuItem(title:"Hide character",action:#selector(toggleVisibility),keyEquivalent:"")
        toggle.target = self;menu.addItem(toggle)
        let quit = NSMenuItem(title:"Quit",action:#selector(quitApp),keyEquivalent:"q")
        quit.target = self; menu.addItem(quit)
        statusItem.menu = menu
        changeMode(mode)
        setSize(scale: sizeScale)
    }
    private func changeMode(_ newMode: String) {
        mode = newMode
        updateStatus()
        if appReady {webView.evaluateJavaScript("window.setMode('\(newMode)')",completionHandler:nil)}
        if let menu = statusItem.menu {
            let names = ["Higher of CPU / RAM":"max","CPU only":"cpu","RAM usage only":"ram"]
            for item in menu.items {if let m=names[item.title] {item.state = m == newMode ? .on : .off}}
        }
    }
    private func setSize(scale: CGFloat) {
        sizeScale = scale
        UserDefaults.standard.set(Double(scale), forKey: "companionSize")
        positionPanel(animated: true)
        if appReady {
            webView.evaluateJavaScript("window.setCompanionScale(\(Int(scale * 100)))", completionHandler: nil)
        }
        if let menu = statusItem.menu {
            for item in menu.items where item.title.hasPrefix("Size ·") { item.state = .off }
            if let chosen = menu.items.first(where: {
                ($0.title == "Size · Tiny (25%)" && scale == 0.25) ||
                ($0.title == "Size · Small (40%)" && scale == 0.40) ||
                ($0.title == "Size · Medium (65%)" && scale == 0.65) ||
                ($0.title == "Size · Normal (100%)" && scale == 1.0) ||
                ($0.title == "Size · Large (140%)" && scale == 1.40)
            }) { chosen.state = .on }
        }
    }
    @objc private func chooseMax() { changeMode("max") }
    @objc private func chooseCPU() { changeMode("cpu") }
    @objc private func chooseRAM() { changeMode("ram") }
    @objc private func sizeTiny() { setSize(scale: 0.25) }
    @objc private func sizeSmall() { setSize(scale: 0.40) }
    @objc private func sizeMedium() { setSize(scale: 0.65) }
    @objc private func sizeNormal() { setSize(scale: 1.0) }
    @objc private func sizeLarge() { setSize(scale: 1.40) }
    @objc private func toggleVisibility(_ sender: NSMenuItem) {
        hidden.toggle()
        if hidden {panel.orderOut(nil)} else {panel.orderFrontRegardless()}
        sender.title = hidden ? "Show character" : "Hide character"
    }
    @objc private func quitApp() { NSApp.terminate(nil) }
}

let app = NSApplication.shared
let controller = Controller()
app.delegate = controller
app.run()
