import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { type Conversation, type Job } from "@shared/schema";
import { MessageSquare } from "lucide-react";

interface ConversationWithJob extends Conversation {
  job?: Job;
  lastMessage?: string;
}

interface ConversationListProps {
  conversations: ConversationWithJob[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className={`p-4 cursor-pointer hover-elevate transition-all ${
            selectedConversationId === conversation.id
              ? "border-primary bg-primary/5"
              : ""
          }`}
          onClick={() => onSelectConversation(conversation.id)}
          data-testid={`conversation-${conversation.id}`}
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback>
                <MessageSquare className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm line-clamp-1" data-testid="text-job-title">
                  {conversation.job?.title || "Job Conversation"}
                </h3>
                {conversation.job?.serviceType && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {conversation.job.serviceType}
                  </Badge>
                )}
              </div>
              {conversation.lastMessage && (
                <p className="text-sm text-muted-foreground line-clamp-1" data-testid="text-last-message">
                  {conversation.lastMessage}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
