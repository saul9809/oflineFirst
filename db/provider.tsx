import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync, SQLiteProvider } from "expo-sqlite";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import migrations from "../drizzle/migrations";
import * as schema from "./schema";

// -- Initialys the Database
const DATABASE_NAME = "app.db";

const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });

function MigrationGate({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  if (error) {
    return (
      <View style={styles.notification}>
        <Text>Migration failed:{error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View style={styles.notification}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <>{children}</>;
}
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME}>
      <MigrationGate>{children}</MigrationGate>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  notification: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
