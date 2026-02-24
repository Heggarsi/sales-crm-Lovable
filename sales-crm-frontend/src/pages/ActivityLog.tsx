import { Activity, Search, Filter, Phone, Mail, MessageSquare, Calendar, FileText, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const activities = [
  { id: 1, type: "call", icon: Phone, title: "Phone call with Acme Corp", description: "Discussed pricing options and next steps", user: "John Smith", time: "10 minutes ago", entity: "Lead: Acme Corp" },
  { id: 2, type: "email", icon: Mail, title: "Email sent to TechStart", description: "Sent proposal document v2.1", user: "Sarah Johnson", time: "25 minutes ago", entity: "Opportunity: Cloud Migration" },
  { id: 3, type: "meeting", icon: Calendar, title: "Meeting scheduled", description: "Product demo scheduled for Jan 20", user: "Mike Wilson", time: "1 hour ago", entity: "Lead: Global Retail" },
  { id: 4, type: "note", icon: MessageSquare, title: "Note added", description: "Client prefers quarterly payment terms", user: "John Smith", time: "2 hours ago", entity: "Opportunity: Enterprise Deal" },
  { id: 5, type: "proposal", icon: FileText, title: "Proposal updated", description: "Updated proposal to version 3.0", user: "Emily Davis", time: "3 hours ago", entity: "Proposal: PROP-003" },
  { id: 6, type: "assignment", icon: Users, title: "Lead assigned", description: "Lead assigned to Sarah Johnson", user: "Admin", time: "4 hours ago", entity: "Lead: Finance Corp" },
  { id: 7, type: "call", icon: Phone, title: "Follow-up call completed", description: "Confirmed meeting for next week", user: "Sarah Johnson", time: "5 hours ago", entity: "Lead: Healthcare Plus" },
  { id: 8, type: "email", icon: Mail, title: "Intro email sent", description: "Sent introduction and company overview", user: "Mike Wilson", time: "6 hours ago", entity: "Lead: Startup Inc" },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "call": return "bg-blue-500";
    case "email": return "bg-green-500";
    case "meeting": return "bg-purple-500";
    case "note": return "bg-yellow-500";
    case "proposal": return "bg-indigo-500";
    case "assignment": return "bg-pink-500";
    default: return "bg-gray-500";
  }
};

export default function ActivityLog() {
  return (
    <AppLayout userRole="admin" userName="Alex Thompson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Activity className="w-7 h-7 text-primary" />
              Activity Log
            </h1>
            <p className="text-muted-foreground">Track all sales activities and interactions</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Button variant="outline" className="justify-start">
            <Phone className="w-4 h-4 mr-2 text-blue-500" />
            Calls
          </Button>
          <Button variant="outline" className="justify-start">
            <Mail className="w-4 h-4 mr-2 text-green-500" />
            Emails
          </Button>
          <Button variant="outline" className="justify-start">
            <Calendar className="w-4 h-4 mr-2 text-purple-500" />
            Meetings
          </Button>
          <Button variant="outline" className="justify-start">
            <MessageSquare className="w-4 h-4 mr-2 text-yellow-500" />
            Notes
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="w-4 h-4 mr-2 text-indigo-500" />
            Proposals
          </Button>
          <Button variant="outline" className="justify-start">
            <Users className="w-4 h-4 mr-2 text-pink-500" />
            Assignments
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search activities..." className="pl-10" />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full ${getTypeColor(activity.type)} flex items-center justify-center text-white flex-shrink-0`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{activity.title}</h3>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{activity.entity}</Badge>
                          <span className="text-xs text-muted-foreground">by {activity.user}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
