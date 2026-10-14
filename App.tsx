import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, TextInput, StyleSheet, Animated, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts, IBMPlexSansKR_400Regular, IBMPlexSansKR_500Medium, IBMPlexSansKR_700Bold } from "@expo-google-fonts/ibm-plex-sans-kr";
import { StoreProvider, useStore } from "./src/lib/store";
import { color, radius, space, type } from "./src/theme";
import { TabBar, type Tab } from "./src/components/TabBar";
import { Button, Eyebrow, Muted } from "./src/components/ui";
import { CodebookScreen } from "./src/screens/CodebookScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

export default function App() {
  const [loaded] = useFonts({ IBMPlexSansKR_400Regular, IBMPlexSansKR_500Medium, IBMPlexSansKR_700Bold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: color.bg000 }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { ready, settings, setSettings, msgs } = useStore();
  const [tab, setTab] = useState<Tab>("book");
  const [badge, setBadge] = useState(false);
  const [toast, setToast] = useState("");
  const op = useRef(new Animated.Value(0)).current;
  const seen = useRef(0);

  useEffect(() => {
    const incoming = msgs.filter((m) => m.from !== settings.uid).length;
    if (incoming > seen.current && tab !== "chat") setBadge(true);
    seen.current = incoming;
  }, [msgs]);
  useEffect(() => { if (tab === "chat") setBadge(false); }, [tab]);

  const showToast = (t: string) => { setToast(t); Animated.sequence([Animated.timing(op, { toValue: 1, duration: 150, useNativeDriver: true }), Animated.delay(1400), Animated.timing(op, { toValue: 0, duration: 200, useNativeDriver: true })]).start(); };

  if (!ready) return <View style={{ flex: 1, backgroundColor: color.bg000 }} />;
  if (!settings.name) return <Welcome onDone={(n) => setSettings({ name: n })} />;

  return (
    <SafeAreaView style={s.app} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {tab === "book" && <CodebookScreen onToast={showToast} />}
        {tab === "chat" && <ChatScreen />}
        {tab === "settings" && <SettingsScreen onToast={showToast} />}
      </View>
      <TabBar current={tab} onChange={setTab} badge={badge} />
      <Animated.View pointerEvents="none" style={[s.toast, { opacity: op }]}><Text style={s.toastTxt}>{toast}</Text></Animated.View>
    </SafeAreaView>
  );
}

function Welcome({ onDone }: { onDone: (name: string) => void }) {
  const [n, setN] = useState("");
  return (
    <SafeAreaView style={[s.app, { justifyContent: "center", paddingHorizontal: space.s6, gap: 20 }]}>
      <Image source={require("./assets/mascot/cat-shh.png")} style={{ width: 200, height: 200, alignSelf: "center", borderRadius: radius.lg }} />
      <View style={{ gap: 8 }}>
        <Eyebrow>암호쳇</Eyebrow>
        <Text style={[type.title, { color: color.ink }]}>둘만 아는 숫자 하나.</Text>
        <Muted style={{ fontSize: 14, lineHeight: 20 }}>숫자와 알파벳으로만 대화해요. 뜻은 설정집에 있고, 설정집은 우리끼리만 알아요.</Muted>
      </View>
      <TextInput value={n} onChangeText={setN} maxLength={10} placeholder="요원 이름 (예: 꾸미)" placeholderTextColor={color.inkFaint} style={s.input} onSubmitEditing={() => n.trim() && onDone(n.trim())} />
      <Button label="접선 시작" onPress={() => n.trim() && onDone(n.trim())} style={{ height: 54 }} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: color.bg000 },
  input: { height: 50, borderWidth: 1, borderColor: color.line200, borderRadius: radius.md, backgroundColor: color.bg100, color: color.ink, paddingHorizontal: 14, ...type.body },
  toast: { position: "absolute", alignSelf: "center", bottom: 110, backgroundColor: color.ink, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill },
  toastTxt: { ...type.caption, fontFamily: type.label.fontFamily, fontSize: 13, color: color.inkOnInk },
});
