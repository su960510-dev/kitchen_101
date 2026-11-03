import CoreGraphics
import ExpoModulesCore
import ImageIO
import Vision

/// Apple Vision으로 라벨 텍스트를 읽는다. 이미지는 기기 밖으로 나가지 않는다.
/// 결과는 후보 텍스트일 뿐이며 날짜 확정은 JS 쪽 사용자 확인 단계에서만 일어난다.
public final class FoodLabelOcrModule: Module {
  /// 라벨 글자를 읽기에 충분한 긴 변 픽셀. 원본 전체를 메모리에 올리지 않는다.
  private static let maxPixelSize = 2400

  public func definition() -> ModuleDefinition {
    Name("FoodLabelOcr")

    AsyncFunction("getCapabilities") { () -> [String: Any] in
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      let languages = (try? request.supportedRecognitionLanguages()) ?? []
      return [
        "available": languages.contains { $0.hasPrefix("ko") },
        "languages": languages,
        "offline": true,
      ]
    }

    AsyncFunction("recognize") { (uri: String) throws -> [String: Any] in
      let started = Date()
      guard let image = Self.loadDownscaledImage(uri: uri) else {
        throw FoodLabelOcrImageException()
      }

      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.recognitionLanguages = ["ko-KR", "en-US"]
      // 언어 보정이 숫자 날짜를 다른 글자로 바꾸지 않도록 끈다.
      request.usesLanguageCorrection = false

      // 썸네일 생성 시 EXIF 방향이 픽셀에 반영되므로 .up 으로 처리한다.
      let handler = VNImageRequestHandler(cgImage: image, orientation: .up, options: [:])
      try handler.perform([request])

      let lines: [[String: Any]] = (request.results ?? []).compactMap { observation in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let box = observation.boundingBox
        return [
          "text": candidate.string,
          "confidence": Double(candidate.confidence),
          // Vision은 좌하단 원점의 정규화 좌표를 쓰므로 좌상단 원점으로 바꾼다.
          "boundingBox": [
            "x": Double(box.minX),
            "y": Double(1 - box.maxY),
            "width": Double(box.width),
            "height": Double(box.height),
          ],
        ]
      }

      return [
        "lines": lines,
        "processingMs": Int(Date().timeIntervalSince(started) * 1000),
        "imageWidth": image.width,
        "imageHeight": image.height,
      ]
    }
    .runOnQueue(.global(qos: .userInitiated))
  }

  private static func loadDownscaledImage(uri: String) -> CGImage? {
    let url = URL(string: uri) ?? URL(fileURLWithPath: uri)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
    ]
    return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
  }
}

final class FoodLabelOcrImageException: Exception {
  override var reason: String { "이미지를 읽을 수 없습니다." }
}
