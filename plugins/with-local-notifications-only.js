const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * expo-notifications 는 원격 푸시용 `aps-environment` 권한을 추가한다. 이 앱은 로컬 알림만 쓰므로
 * 필요 없고, Apple 무료 개인 팀은 이 권한이 있으면 개발 프로비저닝 프로필을 만들지 못한다.
 * 로컬 알림 예약에는 이 권한이 필요 없다.
 */
module.exports = function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
