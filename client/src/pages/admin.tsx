import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Shield, Users, MessageSquare, Trash2, Search, ArrowLeft, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ totalUsers: 0, totalConversations: 0, totalMessages: 0, adminCount: 0 });

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, []);

  useEffect(() => {
    setStats({
      totalUsers: users.length,
      adminCount: users.filter(u => u.isAdmin === "true").length,
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((acc, c) => acc + (c.messageCount || 0), 0)
    });
  }, [users, conversations]);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    else if (res.status === 403) setLocation("/");
  };

  const fetchConversations = async () => {
    const res = await fetch("/api/admin/conversations");
    if (res.ok) setConversations(await res.json());
  };

  const fetchMessages = async (conversationId: number) => {
    const res = await fetch(`/api/admin/conversations/${conversationId}/messages`);
    if (res.ok) {
      setMessages(await res.json());
      setSelectedConversation(conversations.find(c => c.id === conversationId));
    }
  };

  const deleteConversation = async (id: number) => {
    if (!confirm("Delete this conversation?")) return;
    const res = await fetch(`/api/admin/conversations/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchConversations();
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user and all their data?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
  };

  const toggleAdmin = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, { method: "PATCH" });
    if (res.ok) fetchUsers();
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                <ArrowLeft size={20} />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Manage users and conversations</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Search className="text-muted-foreground" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                </div>
                <Users className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Admins</p>
                  <p className="text-3xl font-bold mt-1">{stats.adminCount}</p>
                </div>
                <Shield className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Conversations</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalConversations}</p>
                </div>
                <MessageSquare className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Activity</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalMessages}</p>
                </div>
                <BarChart3 className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white">
            <TabsTrigger value="users" className="gap-2">
              <Users size={16} />
              Users
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare size={16} />
              Conversations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{user.firstName} {user.lastName}</p>
                            {user.isAdmin === "true" && (
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                <Shield size={12} className="mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-400">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={user.isAdmin === "true" ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdmin(user.id)}
                        >
                          {user.isAdmin === "true" ? "Remove Admin" : "Make Admin"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversations">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Conversations ({filteredConversations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                          selectedConversation?.id === conv.id ? "bg-blue-50 border-blue-400 shadow-md" : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => fetchMessages(conv.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">{conv.title}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Badge variant="outline" className="text-xs">{conv.userEmail}</Badge>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{new Date(conv.createdAt).toLocaleString()}</p>
                          </div>
                          <MessageSquare size={16} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {selectedConversation ? selectedConversation.title : "Select a conversation"}
                  </CardTitle>
                  {selectedConversation && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteConversation(selectedConversation.id)}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-lg ${
                            msg.role === "user" 
                              ? "bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-500" 
                              : "bg-gradient-to-r from-gray-100 to-gray-50 border-l-4 border-gray-500"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={msg.role === "user" ? "default" : "secondary"}>
                              {msg.role.toUpperCase()}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[600px] text-gray-400">
                      <div className="text-center">
                        <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Select a conversation to view messages</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
