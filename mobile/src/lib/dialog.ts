// رسائل التنبيه والتأكيد: Alert على الجوال، ونوافذ المتصفح على الويب (Alert ما يشتغل بالويب)
import { Alert, Platform } from 'react-native';

export function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
  else Alert.alert(title, msg);
}
export function confirm(title: string, msg: string, yes: string, onYes: () => void) {
  if (Platform.OS === 'web') { if (window.confirm(`${title}\n${msg}`)) onYes(); return; }
  Alert.alert(title, msg, [{ text: 'لا' }, { text: yes, style: 'destructive', onPress: onYes }]);
}
