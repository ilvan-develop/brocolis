import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { t } from "@/lib/t";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function PrescriptionUploadScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [files, setFiles] = useState<Array<{ uri: string; type: string }>>([]);

  const safeOrderId = String(orderId ?? "");

  const uploadMutation = useMutation({
    mutationFn: () =>
      api.prescription.upload(ORG_ID, "AO", {
        orderId: safeOrderId,
        files,
      }),
    onSuccess: () => {
      router.push(`/order/${safeOrderId}`);
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 4 - files.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType ?? "image/jpeg",
      }));
      setFiles((prev) => [...prev, ...newFiles].slice(0, 4));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFile = {
        uri: result.assets[0].uri,
        type: result.assets[0].mimeType ?? "image/jpeg",
      };
      setFiles((prev) => [...prev, newFile].slice(0, 4));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
        <View className="flex-row items-center gap-2">
          <Button
            label="←"
            variant="ghost"
            size="icon"
            onPress={() => router.back()}
          />
          <Text className="text-xl font-bold text-foreground">
            {t("prescription.title")}
          </Text>
        </View>

        <Text className="text-sm text-muted-foreground">
          Carregue a sua receita médica (máximo 4 imagens)
        </Text>

        <View className="flex-row gap-2">
          <Button
            label="Galeria"
            variant="outline"
            onPress={pickImage}
            disabled={files.length >= 4}
          />
          <Button
            label="Câmara"
            variant="outline"
            onPress={takePhoto}
            disabled={files.length >= 4}
          />
        </View>

        {files.length > 0 && (
          <View className="gap-2">
            {files.map((file, idx) => (
              <View
                key={idx}
                className="flex-row items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <Text
                  className="flex-1 text-sm text-foreground"
                  numberOfLines={1}
                >
                  {file.uri.split("/").pop()}
                </Text>
                <Button
                  label="Remover"
                  variant="ghost"
                  size="sm"
                  onPress={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                />
              </View>
            ))}
          </View>
        )}

        <Button
          label={uploadMutation.isPending ? "..." : t("prescription.upload")}
          onPress={() => uploadMutation.mutate()}
          disabled={files.length === 0 || uploadMutation.isPending}
        />

        {uploadMutation.isError && (
          <Text className="text-sm text-destructive">{t("error.generic")}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
