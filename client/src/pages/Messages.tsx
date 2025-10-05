import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConversationList } from "@/components/ConversationList";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { Card } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Message, type Conversation, type Job } from "@shared/schema";
import { MessageSquare } from "lucide-react";

export default function Messages() {
  const currentUserId = "demo-user-1";
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const { data: conversations = [] } = useQuery<(Conversation & { job?: Job })[]>({
    queryKey: ["/api/conversations", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations?userId=${currentUserId}`);
      return response.json();
    },
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const response = await fetch(`/api/messages/${selectedConversationId}`);
      return response.json();
    },
    enabled: !!selectedConversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversationId) throw new Error("No conversation selected");
      return apiRequest("POST", "/api/messages", {
        conversationId: selectedConversationId,
        senderId: currentUserId,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversationId] });
    },
  });

  const handleNewMessage = useCallback((data: any) => {
    if (data.type === "new_message") {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    }
  }, []);

  useWebSocket({ userId: currentUserId, onMessage: handleNewMessage });

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with service providers and customers
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
            <Card className="lg:col-span-1 flex flex-col overflow-hidden">
              <div className="border-b p-4">
                <h2 className="font-semibold">Conversations</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  selectedConversationId={selectedConversationId || undefined}
                  onSelectConversation={setSelectedConversationId}
                />
              </div>
            </Card>

            <Card className="lg:col-span-2 flex flex-col overflow-hidden">
              {selectedConversationId ? (
                <>
                  <div className="border-b p-4">
                    <h2 className="font-semibold">
                      {conversations.find((c) => c.id === selectedConversationId)?.job?.title ||
                        "Conversation"}
                    </h2>
                  </div>
                  <MessageList messages={messages} currentUserId={currentUserId} />
                  <MessageInput
                    onSend={(content) => sendMessageMutation.mutate(content)}
                    disabled={sendMessageMutation.isPending}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a conversation to start messaging
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
