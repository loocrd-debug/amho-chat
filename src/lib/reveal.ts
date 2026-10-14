// 해독 잠금: 설정이 켜져 있으면 지문/얼굴 확인 뒤에만 뜻을 보여준다.
import * as LocalAuthentication from "expo-local-authentication";

export async function unlockReveal(required: boolean): Promise<boolean> {
  if (!required) return true;
  try {
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = has && (await LocalAuthentication.isEnrolledAsync());
    if (!enrolled) return true; // 생체 미등록 기기는 그냥 보여준다 (PIN은 2차)
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: "암호 해독", cancelLabel: "취소", disableDeviceFallback: false });
    return r.success;
  } catch { return false; }
}
