import AppKit
import CoreGraphics

let directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let frontURL = directory.appendingPathComponent("Kriana_Business_Card_Improved_Front.png")
let backURL = directory.appendingPathComponent("Kriana_Business_Card_Improved_Back.png")
let outputURL = directory.appendingPathComponent("Kriana_Business_Card_10_Up_US_Letter_Print_Ready.pdf")

guard let front = NSImage(contentsOf: frontURL),
      let back = NSImage(contentsOf: backURL) else {
    fatalError("Could not load card artwork")
}

let pointsPerMM: CGFloat = 72 / 25.4
var pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter
let cardWidth = 90 * pointsPerMM
let cardHeight = 50 * pointsPerMM
let gridWidth = cardWidth * 2
let gridHeight = cardHeight * 5
let originX = (pageRect.width - gridWidth) / 2
let originY = (pageRect.height - gridHeight) / 2

guard let consumer = CGDataConsumer(url: outputURL as CFURL),
      let pdf = CGContext(consumer: consumer, mediaBox: &pageRect, nil) else {
    fatalError("Could not create PDF")
}

func cardRect(column: Int, row: Int) -> CGRect {
    CGRect(x: originX + CGFloat(column) * cardWidth,
           y: originY + CGFloat(4 - row) * cardHeight,
           width: cardWidth,
           height: cardHeight)
}

func drawCutGuides(_ context: CGContext) {
    context.saveGState()
    context.setStrokeColor(NSColor.black.cgColor)
    context.setLineWidth(0.35)

    let mark: CGFloat = 10
    for column in 0...2 {
        let x = originX + CGFloat(column) * cardWidth
        context.move(to: CGPoint(x: x, y: originY - mark))
        context.addLine(to: CGPoint(x: x, y: originY))
        context.move(to: CGPoint(x: x, y: originY + gridHeight))
        context.addLine(to: CGPoint(x: x, y: originY + gridHeight + mark))
    }
    for row in 0...5 {
        let y = originY + CGFloat(row) * cardHeight
        context.move(to: CGPoint(x: originX - mark, y: y))
        context.addLine(to: CGPoint(x: originX, y: y))
        context.move(to: CGPoint(x: originX + gridWidth, y: y))
        context.addLine(to: CGPoint(x: originX + gridWidth + mark, y: y))
    }
    context.strokePath()
    context.restoreGState()
}

for image in [front, back] {
    guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    pdf.beginPDFPage(nil)
    pdf.setFillColor(NSColor.white.cgColor)
    pdf.fill(pageRect)
    for row in 0..<5 {
        for column in 0..<2 {
            pdf.draw(cgImage, in: cardRect(column: column, row: row))
        }
    }
    drawCutGuides(pdf)
    pdf.endPDFPage()
}

pdf.closePDF()
print(outputURL.path)
