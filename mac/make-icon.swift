import AppKit
import Foundation
let image = NSImage(size: NSSize(width: 512, height: 512))
image.lockFocus()
NSColor(calibratedRed: 0.08, green: 0.09, blue: 0.12, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 0,y: 0,width: 512,height: 512), xRadius: 110, yRadius: 110).fill()
let orange = NSColor(calibratedRed: 1, green: 0.34, blue: 0.12, alpha: 1)
orange.setStroke()
let chip = NSBezierPath(roundedRect: NSRect(x: 125,y: 125,width: 262,height: 262),xRadius: 36,yRadius: 36)
chip.lineWidth = 18
chip.stroke()
for offset in stride(from: 165, through: 350, by: 46) {
    for (start,end) in [(NSPoint(x: offset,y: 85),NSPoint(x: offset,y: 115)),(NSPoint(x: offset,y: 397),NSPoint(x: offset,y: 427)),(NSPoint(x: 85,y: offset),NSPoint(x: 115,y: offset)),(NSPoint(x: 397,y: offset),NSPoint(x: 427,y: offset))] {
        let pin = NSBezierPath(); pin.move(to: start);pin.line(to: end);pin.lineWidth=15;pin.lineCapStyle = .round;pin.stroke()
    }
}
let text = "HOT" as NSString
let attributes: [NSAttributedString.Key:Any] = [.font:NSFont.systemFont(ofSize: 90,weight:.black),.foregroundColor:NSColor.white]
text.draw(at: NSPoint(x: (512-text.size(withAttributes:attributes).width)/2,y: 208),withAttributes:attributes)
image.unlockFocus()
let bitmap = NSBitmapImageRep(data: image.tiffRepresentation!)!
try bitmap.representation(using:.png,properties:[:])!.write(to: URL(fileURLWithPath:CommandLine.arguments[1]))
