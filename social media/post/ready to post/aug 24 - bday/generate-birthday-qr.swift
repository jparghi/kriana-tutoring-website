import AppKit
let sourcePath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]
let qrPath = CommandLine.arguments[3]

guard let source = NSImage(contentsOfFile: sourcePath),
      let qrImage = NSImage(contentsOfFile: qrPath) else {
    fatalError("Could not load source artwork or QR image")
}

let canvas = NSImage(size: source.size)
canvas.lockFocus()
source.draw(in: NSRect(origin: .zero, size: source.size))

// The generated artwork is 1024×1536. This rectangle sits inside its blank
// white QR panel, leaving the quiet zone intact for reliable scanning.
qrImage.draw(
    in: NSRect(x: 806, y: 16, width: 112, height: 112),
    from: NSRect(origin: .zero, size: qrImage.size),
    operation: .copy,
    fraction: 1.0
)
canvas.unlockFocus()

guard let tiff = canvas.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let png = bitmap.representation(using: .png, properties: [:]) else {
    fatalError("Could not encode finished artwork")
}
try png.write(to: URL(fileURLWithPath: outputPath))
