import AppKit
import WebKit

final class Smoke: NSObject, WKNavigationDelegate {
    let view = WKWebView(frame: NSRect(x: 0, y: 0, width: 680, height: 397))
    var window: NSWindow!
    func run() {
        window = NSWindow(contentRect: view.frame, styleMask: [.borderless], backing: .buffered, defer: false)
        window.backgroundColor = .clear
        window.isOpaque = false
        view.setValue(false, forKey: "drawsBackground")
        view.underPageBackgroundColor = .clear
        window.contentView = view
        window.orderFrontRegardless()
        view.navigationDelegate = self
        view.configuration.userContentController.addUserScript(WKUserScript(source: "window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
        view.loadFileURL(root.appendingPathComponent("index.html"), allowingReadAccessTo: root)
        DispatchQueue.main.asyncAfter(deadline: .now() + 35) { print("FAIL: WebKit timed out"); exit(1) }
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.view.evaluateJavaScript("""
            (()=>{
              if(typeof window.setNative !== 'function') throw Error('scene.js failed to load');
              window.setNative(); window.setNativeMetrics(100,0);
              const c=document.querySelector('#scene');
              const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
              let visible=0; for(let i=3;i<pixels.length;i+=4) if(pixels[i]) visible++;
              if(visible<10000) throw Error('Canvas blank: '+visible+'; errors: '+JSON.stringify(window.__errors));
              if(getComputedStyle(document.body).backgroundColor!=='rgba(0, 0, 0, 0)') throw Error('Body opaque');
              return 'PASS: WebKit loads bundled JS, draws '+visible+' pixels, native CSS transparent, metrics bridge works';
            })()
            """) { value, error in
                if let error = error { print("FAIL: \(error)"); exit(1) }
                print(value ?? "no result")
                for (index, delay) in [3.4, 3.55, 3.7].enumerated() {
                    DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                        self.saveSnapshot("reactions-rub-\(index)")
                    }
                }
                self.checkCount(5, after: 10) {
                    self.view.takeSnapshot(with: nil) { image, error in
                        guard error == nil, let data = image?.tiffRepresentation,
                              let bitmap = NSBitmapImageRep(data: data),
                              let corner = bitmap.colorAt(x: 0, y: 0), corner.alphaComponent < 0.01 else {
                            print("FAIL: native WebKit snapshot has an opaque background"); exit(1)
                        }
                        try? bitmap.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: "build/native-preview.png"))
                        print("PASS: native rendered background alpha is zero")
                    }
                    self.view.evaluateJavaScript("window.setNativeMetrics(0,0)") { _, error in
                        if let error = error { print("FAIL: \(error)"); exit(1) }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { self.saveSnapshot("reactions-cheer") }
                        self.checkCount(0, after: 11) { print("PASS: native five-character entry and full recovery; no JS errors"); exit(0) }
                    }
                }
            }
        }
    }
    func saveSnapshot(_ name: String) {
        view.takeSnapshot(with: nil) { image, error in
            guard error == nil, let data = image?.tiffRepresentation,
                  let bitmap = NSBitmapImageRep(data: data),
                  let png = bitmap.representation(using: .png, properties: [:]) else {
                print("FAIL: reaction snapshot"); exit(1)
            }
            do { try png.write(to: URL(fileURLWithPath: "build/\(name).png")) }
            catch { print("FAIL: \(error)"); exit(1) }
        }
    }
    func checkCount(_ expected: Int, after seconds: Double, completion: @escaping () -> Void) {
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
            self.view.evaluateJavaScript("JSON.stringify({count:Number(document.querySelector('#charactersReadout').textContent),errors:window.__errors})") { value, error in
                guard error == nil, let text = value as? String,
                      let data = text.data(using: .utf8),
                      let result = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      result["count"] as? Int == expected,
                      let errors = result["errors"] as? [String], errors.isEmpty else {
                    print("FAIL: expected \(expected) characters, got \(String(describing: value)), error \(String(describing: error))"); exit(1)
                }
                completion()
            }
        }
    }

}
let application = NSApplication.shared
application.setActivationPolicy(.accessory)
let smoke = Smoke()
smoke.run()
application.run()
