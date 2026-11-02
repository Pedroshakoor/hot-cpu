import AppKit
import WebKit
import ImageIO
import UniformTypeIdentifiers

final class PoseDemo: NSObject, WKNavigationDelegate {
    let view = WKWebView(frame: NSRect(x:0,y:0,width:680,height:397))
    var window: NSWindow!
    var timer: Timer?
    var images = [CGImage]()
    var captureBusy = false
    var start = Date()
    var previousStage = -1
    let pressures = [0,20,40,60,80,100,80,60,40,20,0]
    func run() {
        window = NSWindow(contentRect:view.frame,styleMask:[.borderless],backing:.buffered,defer:false)
        window.backgroundColor = .clear;window.isOpaque = false
        view.setValue(false,forKey:"drawsBackground");view.underPageBackgroundColor = .clear
        window.contentView = view;window.orderFrontRegardless();view.navigationDelegate = self
        let url = URL(fileURLWithPath:CommandLine.arguments[1])
        view.loadFileURL(url.appendingPathComponent("index.html"),allowingReadAccessTo:url)
        DispatchQueue.main.asyncAfter(deadline:.now()+45){print("FAIL: pose demo timed out");exit(1)}
    }
    func webView(_ webView: WKWebView,didFinish navigation: WKNavigation!) {
        view.evaluateJavaScript("window.setNative();window.setNativeMetrics(0,0)"){_,error in
            if let error=error {print("FAIL: \(error)");exit(1)}
            self.start=Date()
            self.timer=Timer.scheduledTimer(withTimeInterval:0.125,repeats:true){_ in self.tick()}
        }
    }
    func tick() {
        let stage = Int(Date().timeIntervalSince(start)/2.2)
        if stage>=pressures.count {timer?.invalidate();finish();return}
        if stage != previousStage {
            previousStage=stage
            view.evaluateJavaScript("window.setNativeMetrics(\(pressures[stage]),0)"){_,error in if let error=error{print("FAIL: \(error)");exit(1)}}
        }
        guard !captureBusy else {return};captureBusy=true
        let config = WKSnapshotConfiguration();config.snapshotWidth=340
        view.takeSnapshot(with:config){image,error in
            defer {self.captureBusy=false}
            guard error == nil,let data=image?.tiffRepresentation,let bitmap=NSBitmapImageRep(data:data),let frame=bitmap.cgImage else {print("FAIL: snapshot");exit(1)}
            self.images.append(frame)
            if stage==5,let png=bitmap.representation(using:.png,properties:[:]) {try? png.write(to:URL(fileURLWithPath:"build/hot-cpu-high.png"))}
        }
    }
    func finish() {
        guard images.count>100 else {print("FAIL: missing animation frames");exit(1)}
        let url=URL(fileURLWithPath:"docs/hot-cpu-demo.gif")
        let destination=CGImageDestinationCreateWithURL(url as CFURL,UTType.gif.identifier as CFString,images.count,nil)!
        CGImageDestinationSetProperties(destination,[kCGImagePropertyGIFDictionary:[kCGImagePropertyGIFLoopCount:0]] as CFDictionary)
        for frame in images {CGImageDestinationAddImage(destination,frame,[kCGImagePropertyGIFDictionary:[kCGImagePropertyGIFDelayTime:0.125]] as CFDictionary)}
        guard CGImageDestinationFinalize(destination) else {print("FAIL: GIF export");exit(1)}
        print("PASS: \(images.count) actual native frames captured across six pressure stages and recovery");exit(0)
    }
}
let app=NSApplication.shared;app.setActivationPolicy(.accessory)
let demo=PoseDemo();demo.run();app.run()
