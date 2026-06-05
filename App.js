import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function App() {
  const [searchInput, setSearchInput] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const weatherMap = {
    0: { label: "Cerah", emoji: "☀️" },
    1: { label: "Sebagian Cerah", emoji: "🌤️" },
    2: { label: "Berawan", emoji: "⛅" },
    3: { label: "Mendung", emoji: "☁️" },
    45: { label: "Berkabut", emoji: "🌫️" },
    61: { label: "Hujan Ringan", emoji: "🌦️" },
    63: { label: "Hujan", emoji: "🌧️" },
    95: { label: "Badai Petir", emoji: "⛈️" },
  };

  const getWindDirection = (degree) => {
    const directions = [
      "Utara",
      "Timur Laut",
      "Timur",
      "Tenggara",
      "Selatan",
      "Barat Daya",
      "Barat",
      "Barat Laut",
    ];

    return directions[Math.round(degree / 45) % 8];
  };

  useEffect(() => {
    if (!searchInput.trim()) {
      setWeather(null);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${searchInput}&count=1&language=id`,
          {
            signal: controller.signal,
          }
        );

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error("Kota tidak ditemukan");
        }

        const city = geoData.results[0];

        const forecastResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
          {
            signal: controller.signal,
          }
        );

        const forecastData = await forecastResponse.json();

        const weatherInfo =
          weatherMap[forecastData.current_weather.weathercode] || {
            label: "Tidak diketahui",
            emoji: "❓",
          };

        const result = {
          city: city.name,
          country: city.country,
          temperature: forecastData.current_weather.temperature,
          weathercode: forecastData.current_weather.weathercode,
          windspeed: forecastData.current_weather.windspeed,
          winddirection: forecastData.current_weather.winddirection,
          isDay: forecastData.current_weather.is_day,
          maxTemp: forecastData.daily.temperature_2m_max[0],
          minTemp: forecastData.daily.temperature_2m_min[0],
          label: weatherInfo.label,
          emoji: weatherInfo.emoji,
        };

        setWeather(result);

        setHistory((prev) => {
          const updated = [
            result.city,
            ...prev.filter((item) => item !== result.city),
          ];
          return updated.slice(0, 5);
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setWeather(null);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchInput, refreshKey]);

  return (
    <LinearGradient
      colors={["#ffd6e7", "#e6ccff", "#cce7ff"]}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🌸 WeatherFinder</Text>

        <Text style={styles.subtitle}>
          Cari cuaca kota favoritmu
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Masukkan nama kota..."
          value={searchInput}
          onChangeText={setSearchInput}
        />

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => setRefreshKey((prev) => prev + 1)}
        >
          <Text style={styles.refreshText}>🔄 Cari Ulang</Text>
        </TouchableOpacity>

        {history.length > 0 && (
          <>
            <Text style={styles.historyTitle}>
              Riwayat Pencarian
            </Text>

            <View style={styles.historyContainer}>
              {history.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chip}
                  onPress={() => setSearchInput(item)}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {!searchInput && (
          <Text style={styles.message}>
            🌍 Cari kota untuk melihat cuaca
          </Text>
        )}

        {loading && (
          <ActivityIndicator
            size="large"
            color="#d63384"
          />
        )}

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {weather && !loading && (
          <View style={styles.card}>
            <Text style={styles.emoji}>
              {weather.emoji}
            </Text>

            <Text style={styles.temp}>
              {weather.temperature}°C
            </Text>

            <Text style={styles.condition}>
              {weather.label}
            </Text>

            <Text style={styles.city}>
              {weather.city}, {weather.country}
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.info}>
                {weather.isDay
                  ? "☀️ Siang"
                  : "🌙 Malam"}
              </Text>

              <Text style={styles.info}>
                💨 {weather.windspeed} km/j
              </Text>

              <Text style={styles.info}>
                🧭 {getWindDirection(
                  weather.winddirection
                )}
              </Text>

              <Text style={styles.info}>
                ⬆️ Maks: {weather.maxTemp}°C
              </Text>

              <Text style={styles.info}>
                ⬇️ Min: {weather.minTemp}°C
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    color: "#d63384",
  },

  subtitle: {
    textAlign: "center",
    color: "#6c757d",
    marginBottom: 25,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },

  refreshButton: {
    backgroundColor: "#ff66b3",
    padding: 14,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 15,
  },

  refreshText: {
    color: "#fff",
    fontWeight: "bold",
  },

  historyTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#d63384",
  },

  historyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },

  chip: {
    backgroundColor: "#fff0f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },

  message: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },

  error: {
    color: "red",
    textAlign: "center",
    marginTop: 15,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 30,
    padding: 25,
    marginTop: 20,
    alignItems: "center",
    elevation: 5,
  },

  emoji: {
    fontSize: 90,
  },

  temp: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#d63384",
  },

  condition: {
    fontSize: 22,
    marginBottom: 10,
  },

  city: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  infoBox: {
    width: "100%",
    backgroundColor: "#fff5fb",
    borderRadius: 20,
    padding: 15,
  },

  info: {
    fontSize: 16,
    marginVertical: 4,
  },
});