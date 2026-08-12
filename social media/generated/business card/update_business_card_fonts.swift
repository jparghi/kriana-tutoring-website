import AppKit
import CoreGraphics

let directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let frontURL = directory.appendingPathComponent("Kriana_Business_Card_Improved_Front.png")
let backURL = directory.appendingPathComponent("Kriana_Business_Card_Improved_Back.png")
let pdfURL = directory.appendingPathComponent("Kriana_Business_Card_Improved_90x50mm.pdf")

let navy = NSColor(calibratedRed: 7 / 255, green: 35 / 255, blue: 103 / 255, alpha: 1)
let teal = NSColor(calibratedRed: 0 / 255, green: 113 / 255, blue: 117 / 255, alpha: 1)
let paper = NSColor(calibratedRed: 0.992, green: 0.995, blue: 0.995, alpha: 1)

func edit(_ url: URL, changes: (_ size: NSSize) -> Void) -> NSImage {
    guard let source = NSImage(contentsOf: url),
          let bitmap = NSBitmapImageRep(
            bitmapDataPlanes: nil,
            pixelsWide: Int(source.size.width),
            pixelsHigh: Int(source.size.height),
            bitsPerSample: 8,
            samplesPerPixel: 4,
            hasAlpha: true,
            isPlanar: false,
            colorSpaceName: .deviceRGB,
            bytesPerRow: 0,
            bitsPerPixel: 0
          ) else { fatalError("Could not load \(url.path)") }

    let context = NSGraphicsContext(bitmapImageRep: bitmap)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    source.draw(in: NSRect(origin: .zero, size: source.size))
    changes(source.size)
    NSGraphicsContext.restoreGraphicsState()

    let output = NSImage(size: source.size)
    output.addRepresentation(bitmap)
    try! bitmap.representation(using: .png, properties: [:])!.write(to: url)
    return output
}

func topRect(_ x: CGFloat, _ y: CGFloat, _ width: CGFloat, _ height: CGFloat, canvasHeight: CGFloat) -> NSRect {
    NSRect(x: x, y: canvasHeight - y - height, width: width, height: height)
}

func replaceText(
    canvasHeight: CGFloat,
    cover: NSRect,
    text: String,
    fontSize: CGFloat,
    color: NSColor,
    fontName: String = "Arial-BoldMT",
    alignment: NSTextAlignment = .center
) {
    paper.setFill()
    topRect(cover.origin.x, cover.origin.y, cover.width, cover.height, canvasHeight: canvasHeight).fill()

    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = alignment
    let font = NSFont(name: fontName, size: fontSize) ?? .boldSystemFont(ofSize: fontSize)
    let attributes: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: color,
        .paragraphStyle: paragraph
    ]
    let drawRect = topRect(cover.origin.x, cover.origin.y + (cover.height - fontSize * 1.18) / 2,
                           cover.width, fontSize * 1.35, canvasHeight: canvasHeight)
    (text as NSString).draw(in: drawRect, withAttributes: attributes)
}

let front = edit(frontURL) { size in
    replaceText(canvasHeight: size.height,
                cover: NSRect(x: 330, y: 480, width: 1005, height: 65),
                text: "Tutoring, Robotics & Coding",
                fontSize: 62, color: teal, fontName: "ArialNarrow-Bold")
    replaceText(canvasHeight: size.height,
                cover: NSRect(x: 330, y: 545, width: 1005, height: 65),
                text: "STEM in Kanata",
                fontSize: 62, color: teal, fontName: "ArialNarrow-Bold")
    replaceText(canvasHeight: size.height,
                cover: NSRect(x: 350, y: 665, width: 376, height: 70),
                text: "Authorized Partner of",
                fontSize: 38, color: navy, fontName: "ArialNarrow-Bold")
}

let back = edit(backURL) { size in
    replaceText(canvasHeight: size.height,
                cover: NSRect(x: 450, y: 718, width: 410, height: 64),
                text: "Robotics & Coding",
                fontSize: 52, color: teal, fontName: "ArialNarrow-Bold")
    replaceText(canvasHeight: size.height,
                cover: NSRect(x: 450, y: 782, width: 410, height: 57),
                text: "powered by",
                fontSize: 45, color: teal, fontName: "ArialNarrow-Bold")
    replaceText(canvasHeight: size.height,
                cover: NSRect(x: 450, y: 839, width: 410, height: 62),
                text: "Young Engineers",
                fontSize: 52, color: teal, fontName: "ArialNarrow-Bold")
}

var mediaBox = CGRect(x: 0, y: 0, width: 255.1181, height: 141.7323) // 90 × 50 mm
guard let consumer = CGDataConsumer(url: pdfURL as CFURL),
      let pdf = CGContext(consumer: consumer, mediaBox: &mediaBox, nil) else {
    fatalError("Could not create PDF")
}

for image in [front, back] {
    guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    pdf.beginPDFPage(nil)
    pdf.draw(cgImage, in: mediaBox)
    pdf.endPDFPage()
}
pdf.closePDF()
