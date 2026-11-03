const { AndroidConfig, withInfoPlist, withStringsXml } = require('expo/config-plugins');

/**
 * expo.name 은 네이티브 프로젝트 이름으로도 쓰인다. 한글을 넣으면 영숫자만 남아 `1` 이 되어
 * iOS prebuild 가 실패하므로, 프로젝트 이름은 영문으로 두고 기기에 보이는 이름만 여기서 지정한다.
 */
module.exports = function withDisplayName(config, { displayName }) {
  config = withInfoPlist(config, (c) => {
    c.modResults.CFBundleDisplayName = displayName;
    return c;
  });
  return withStringsXml(config, (c) => {
    c.modResults = AndroidConfig.Strings.setStringItem(
      [AndroidConfig.Resources.buildResourceItem({ name: 'app_name', value: displayName })],
      c.modResults,
    );
    return c;
  });
};
