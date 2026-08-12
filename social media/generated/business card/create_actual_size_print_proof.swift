import AppKit
import CoreGraphics

let directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let frontURL = directory.appendingPathComponent("Kriana_Business_Card_Improved_Front.png")
let backURL = directory.appendingPathComponent("Kriana_Business_Card_Improved_Back.png")
let outputURL = directory.appendingPathComponent("Kriana_Business_Card_Actual_Size_US_Letter_Print_Proof.pdf")

guard let front = NSImage(contentsOf: frontURL),
      let back = NSImage(contentsOf: backURL) else {
    fatalError("Could not load the front and back card artwork")
}

let pointsPerMM: CGFloat = 72 / 25.4
let page = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter, portrait
let card = CGSize(width: 90 * pointsPerMM, height: 50 * pointsPerMM)
let cardRect = CGRect(
    x: (page.width - card.width) / 2,
    y: (page.height - card.height) / 2,
    width: card.width,
    height: card.height
)

guard let consumer = CGDataConsumer(url: outputURL as CFURL),
      let pdf = CGContext(consumer: consumer, mediaBox: nil, nil) else {
    fatalError("Could not create the print proof")
}

func drawCropMarks(_ context: CGContext, around rect: CGRect) {
    let gap: CGFloat = 5
    let length: CGFloat = 15
    context.saveGState()
    context.setStrokeColor(NSColor.black.cgColor)
    context.setLineWidth(0.5)

    let corners = [
        (CGPoint(x: rect.minX, y: rect.minY), -1.0, -1.0),
        (CGPoint(x: rect.maxX, y: rect.minY),  1.0, -1.0),
        (CGPoint(x: rect.minX, y: rect.maxY), -1.0,  1.0),
        (CGPoint(x: rect.maxX, y: rect.maxY),  1.0,  1.0)
    ]
    for (corner, xDirection, yDirection) in corners {
        context.move(to: CGPoint(x: corner.x + xDirection * gap, y: corner.y))
        context.addLine(to: CGPoint(x: corner.x + xDirection * (gap + length), y: corner.y))
        context.move(to: CGPoint(x: corner.x, y: corner.y + yDirection * gap))
        context.addLine(to: CGPoint(x: corner.x, y: corner.y + yDirection * (gap + length)))
    }
    context.strokePath()
    context.restoreGState()
}

func drawLabel(_ text: String, at point: CGPoint) {
    let attributes: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 10),
        .foregroundColor: NSColor.black
    ]
    (text as NSString).draw(at: point, withAttributes: attributes)
}

for (index, image) in [front, back].enumerated() {
    pdf.beginPDFPage([kCGPDFContextMediaBox as String: page] as CFDictionary)
    pdf.setFillColor(NSColor.white.cgColor)
    pdf.fill(page)

    if let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        pdf.draw(cgImage, in: cardRect)
    }
    drawCropMarks(pdf, around: cardRect)

    let graphics = NSGraphicsContext(cgContext: pdf, flipped: false)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphics
    drawLabel(index == 0 ? "FRONT — Exact trim size: 90 × 50 mm" : "BACK — Exact trim size: 90 × 50 mm",
              at: CGPoint(x: cardRect.minX, y: cardRect.maxY + 30))
    drawLabel("Print at 100% / Actual Size. Disable Fit, Shrink, or Scale to Page.",
              at: CGPoint(x: cardRect.minX, y: cardRect.minY - 42))
    NSGraphicsContext.restoreGraphicsState()

    pdf.endPDFPage()
}

pdf.closePDF()
print(outputURL.path)
