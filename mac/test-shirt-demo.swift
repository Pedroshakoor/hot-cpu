import AppKit
import WebKit
import AVFoundation
import CoreVideo

final class ShirtDemo: NSObject, WKNavigationDelegate {
    let view=WKWebView(frame:NSRect(x:0,y:0,width:680,height:397))
    var window:NSWindow!
    var timer:Timer?
    var start=Date()
    var lastStage = -1
    var captureBusy=false
    var probeBusy=false
    var ending=false
    var count=0
    var phases=Set<String>()
    var saved=Set<String>()
    var currentPhase="dressed"
    var writer:AVAssetWriter?
    var input:AVAssetWriterInput?
    var adaptor:AVAssetWriterInputPixelBufferAdaptor?
    let pressures=[0,75,75,75,75,75,65,64,64,64,0,0,100,0,0,0]
    func run(){
        window=NSWindow(contentRect:view.frame,styleMask:[.borderless],backing:.buffered,defer:false)
        window.backgroundColor = .clear;window.isOpaque=false
        view.setValue(false,forKey:"drawsBackground");view.underPageBackgroundColor = .clear
        window.contentView=view;window.orderFrontRegardless();view.navigationDelegate=self
        let root=URL(fileURLWithPath:CommandLine.arguments[1])
        view.loadFileURL(root.appendingPathComponent("index.html"),allowingReadAccessTo:root)
        DispatchQueue.main.asyncAfter(deadline:.now()+50){print("FAIL: shirt demo timed out");exit(1)}
    }
    func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){
        view.evaluateJavaScript("window.setNative();window.setNativeMetrics(0,0)"){_,error in
            if let error=error {print("FAIL: \(error)");exit(1)}
            self.start=Date()
            self.timer=Timer.scheduledTimer(withTimeInterval:0.05,repeats:true){_ in self.tick()}
        }
    }
    func tick(){
        let elapsed=Date().timeIntervalSince(start),stage=Int(elapsed/2)
        if stage>=pressures.count {timer?.invalidate();finish();return}
        if stage != lastStage {
            lastStage=stage
            view.evaluateJavaScript("window.setNativeMetrics(\(pressures[stage]),0)"){_,error in if let error=error {print("FAIL: \(error)");exit(1)}}
        }
        if !probeBusy {
            probeBusy=true
            view.evaluateJavaScript("JSON.stringify({phase:window.__gagProbe.costume.phase,location:window.ShirtGag.location(window.__gagProbe.costume),swim:window.ShirtGag.swim(window.__gagProbe.costume)})"){value,error in
                defer{self.probeBusy=false}
                guard error == nil,let string=value as? String,let data=string.data(using:.utf8),let json=try? JSONSerialization.jsonObject(with:data) as? [String:Any],let phase=json["phase"] as? String else {print("FAIL: native phase probe");exit(1)}
                self.phases.insert(phase);self.currentPhase=phase
                if ["covered","prepareReturn","returning"].contains(phase),json["swim"] as? Bool != true {print("FAIL: outfit continuity");exit(1)}
                if phase=="covered",json["location"] as? String != "owner-head" {print("FAIL: lost head shirt");exit(1)}
            }
        }
        guard !captureBusy else{return};captureBusy=true
        let config=WKSnapshotConfiguration();config.snapshotWidth=340
        view.takeSnapshot(with:config){image,error in
            defer{self.captureBusy=false}
            guard error == nil,let data=image?.tiffRepresentation,let bitmap=NSBitmapImageRep(data:data),let frame=bitmap.cgImage else {print("FAIL: native capture");exit(1)}
            self.append(frame,at:elapsed)
            var name:String?
            if self.currentPhase=="covered" {name="shirt-on-head"}
            if self.currentPhase=="throwing" {name="shirt-flight"}
            if self.currentPhase=="dressed" && self.phases.contains("dressing") {name="shirt-restored"}
            if let name=name,!self.saved.contains(name),let png=bitmap.representation(using:.png,properties:[:]) {
                try? png.write(to:URL(fileURLWithPath:"build/\(name).png"));self.saved.insert(name)
            }
        }
    }
    func append(_ image:CGImage,at elapsed:Double){
        if writer == nil {
            let url=URL(fileURLWithPath:"build/shirt-handoff-demo.mp4")
            try? FileManager.default.removeItem(at:url)
            do {writer=try AVAssetWriter(outputURL:url,fileType:.mp4)}catch{print("FAIL: \(error)");exit(1)}
            input=AVAssetWriterInput(mediaType:.video,outputSettings:[AVVideoCodecKey:AVVideoCodecType.h264,AVVideoWidthKey:image.width,AVVideoHeightKey:image.height])
            adaptor=AVAssetWriterInputPixelBufferAdaptor(assetWriterInput:input!,sourcePixelBufferAttributes:[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32BGRA,kCVPixelBufferWidthKey as String:image.width,kCVPixelBufferHeightKey as String:image.height])
            writer!.add(input!);writer!.startWriting();writer!.startSession(atSourceTime:.zero)
        }
        guard input!.isReadyForMoreMediaData else{return}
        var buffer:CVPixelBuffer?
        CVPixelBufferCreate(kCFAllocatorDefault,image.width,image.height,kCVPixelFormatType_32BGRA,[kCVPixelBufferCGImageCompatibilityKey:true,kCVPixelBufferCGBitmapContextCompatibilityKey:true] as CFDictionary,&buffer)
        guard let buffer=buffer else{print("FAIL: video buffer");exit(1)}
        CVPixelBufferLockBaseAddress(buffer,[])
        let context=CGContext(data:CVPixelBufferGetBaseAddress(buffer),width:image.width,height:image.height,bitsPerComponent:8,bytesPerRow:CVPixelBufferGetBytesPerRow(buffer),space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedFirst.rawValue|CGBitmapInfo.byteOrder32Little.rawValue)!
        context.setFillColor(NSColor(calibratedWhite:0.055,alpha:1).cgColor);context.fill(CGRect(x:0,y:0,width:image.width,height:image.height))
        context.draw(image,in:CGRect(x:0,y:0,width:image.width,height:image.height))
        CVPixelBufferUnlockBaseAddress(buffer,[])
        guard adaptor!.append(buffer,withPresentationTime:CMTime(seconds:elapsed,preferredTimescale:600)) else{print("FAIL: append \(String(describing:writer!.error))");exit(1)}
        count+=1
    }
    func finish(){
        guard !ending else{return}
        if captureBusy || probeBusy {DispatchQueue.main.asyncAfter(deadline:.now()+0.05){self.finish()};return}
        ending=true
        let required:Set<String>=["dressed","prepare","changing","throwing","covered","prepareReturn","returning","dressing"]
        guard required.isSubset(of:phases),currentPhase=="dressed",count>200 else {print("FAIL: missing phases \(required.subtracting(phases)), final \(currentPhase), frames \(count)");exit(1)}
        input!.markAsFinished()
        writer!.finishWriting {
            guard self.writer!.status == .completed else {print("FAIL: video finalization");exit(1)}
            print("PASS: native 75% trigger, persistent head shirt, all eight phases, outfit continuity, interrupted cycle, full recovery; \(self.count) video frames");exit(0)
        }
    }
}
let app=NSApplication.shared;app.setActivationPolicy(.accessory)
let demo=ShirtDemo();demo.run();app.run()
