// 푸시 알림: 토큰을 방 멤버 행에 저장한다. 알림 본문은 서버 함수가 숫자만 넣는다.
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase as sb } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

export async function registerPush(roomId: string, uid: string): Promise<string | null> {
  try {
    if (!Device.isDevice || !sb()) return null;
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("signal", { name: "신호", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 120] });
    const { status: cur } = await Notifications.getPermissionsAsync();
    const status = cur === "granted" ? cur : (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return null;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await sb()!.from("room_members").update({ push_token: token }).eq("room_id", roomId).eq("uid", uid);
    return token;
  } catch { return null; }
}
