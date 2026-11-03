Pod::Spec.new do |s|
  s.name           = 'FoodLabelOcr'
  s.version        = '0.1.0'
  s.summary        = 'On-device food label text recognition using Apple Vision'
  s.description    = 'Wraps VNRecognizeTextRequest. No network access.'
  s.author         = ''
  s.homepage       = 'https://github.com/su960510-dev/kitchen_101'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'Vision', 'ImageIO', 'CoreGraphics'
  s.source_files   = '**/*.swift'
end
