let app = NSApplication.shared
let originalSize = UserDefaults.standard.object(forKey: "companionSize")
let controller = Controller()
controller.applicationDidFinishLaunching(Notification(name: NSApplication.didFinishLaunchingNotification))
precondition(!controller.panel.ignoresMouseEvents && !controller.panel.isOpaque)
precondition(!controller.webView.isOpaque)
precondition(controller.webView.value(forKey: "drawsBackground") as? Bool == false)
controller.lastCpu = 27
controller.lastRam = 63
for mode in ["cpu", "ram", "max"] {
    controller.changeMode(mode)
    precondition(controller.mode == mode)
    precondition(controller.statusItem.button!.title == (mode == "cpu" ? "◉ 27%" : "◉ 63%"))
    precondition(controller.cpuReading.title == "CPU: 27%")
    precondition(controller.ramReading.title == "RAM usage: 63%")
    precondition(controller.statusItem.menu!.items.filter { $0.state == .on && !$0.title.hasPrefix("Size ·") }.count == 1)
}
var previousWidth: CGFloat = 0
for size: CGFloat in [0.25, 0.40, 0.65, 1.0, 1.40] {
    controller.setSize(scale: size)
    let width = controller.panel.frame.width
    precondition(width > previousWidth)
    previousWidth = width
    precondition(UserDefaults.standard.double(forKey: "companionSize") == Double(size))
    precondition(controller.statusItem.menu!.items.filter { $0.state == .on && $0.title.hasPrefix("Size ·") }.count == 1)
}
let toggle = controller.statusItem.menu!.items.first { $0.title == "Hide character" }!
controller.toggleVisibility(toggle)
precondition(!controller.panel.isVisible && toggle.title == "Show character")
controller.toggleVisibility(toggle)
precondition(controller.panel.isVisible && toggle.title == "Hide character")
let cpu = controller.monitor.cpuPercent(), ram = controller.monitor.ramPercent()
precondition(cpu.isFinite && (0...100).contains(cpu))
precondition(ram.isFinite && ram > 0 && ram <= 100)
controller.ticker?.invalidate()
controller.panel.orderOut(nil)
if let size = originalSize { UserDefaults.standard.set(size, forKey: "companionSize") }
else { UserDefaults.standard.removeObject(forKey: "companionSize") }
print("PASS: native CPU/RAM readings, three modes, five sizes, checked menu items, size persistence, hide/show, drag-enabled overlay and live menu readings, transparent WebKit background")
