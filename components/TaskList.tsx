// components/TaskList.tsx
import { desc, eq, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { FlatList, Pressable, Text, View } from "react-native";
import { toggleTask } from "../db/operations";
import { db } from "../db/provider";
import { task } from "../db/schema";

export function TaskList({ projectId }: { projectId: string }) {
  // -- Using live query to fetch tasks
  const { data: taskList } = useLiveQuery(
    db
      .select()
      .from(task)
      .where(projectId ? eq(task.projectId, projectId) : isNull(task.deletedAt))
      .orderBy(desc(task.createdAt)),
  );

  return (
    <FlatList
      data={taskList}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => toggleTask(item.id, !item.isCompleted)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: item.isCompleted ? "#10b981" : "#d1d5db",
              backgroundColor: item.isCompleted ? "#10b981" : "transparent",
              marginRight: 12,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                textDecorationLine: item.isCompleted ? "line-through" : "none",
                color: item.isCompleted ? "#9ca3af" : "#111827",
              }}
            >
              {item.title}
            </Text>
            <SyncBadge status={item.syncStatus} />
          </View>
        </Pressable>
      )}
    />
  );
}

function SyncBadge({ status }: { status: string }) {
  if (status === "synced") return null;

  return (
    <Text
      style={{
        fontSize: 11,
        color: status === "conflict" ? "#ef4444" : "#f59e0b",
        marginTop: 2,
      }}
    >
      {status === "pending" ? "Waiting to sync" : "Sync conflict"}
    </Text>
  );
}
