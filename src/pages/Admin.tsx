import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Ban, CheckCircle, User, Mail, Calendar, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  created_at: string;
  banned: boolean;
  ban_reason: string | null;
  banned_until: string | null;
  banned_at: string | null;
  banned_by: string | null;
}

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [banDuration, setBanDuration] = useState<string>("7");
  const [customDays, setCustomDays] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndFetchProfiles();
  }, []);

  const checkAdminAndFetchProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You need admin privileges to access this page.",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      setProfiles((profilesData || []) as unknown as Profile[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const openBanDialog = (profile: Profile) => {
    setSelectedUser(profile);
    setBanDialogOpen(true);
    setBanDuration("7");
    setCustomDays("");
    setBanReason("");
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let bannedUntil: string | null = null;
      
      if (banDuration === "permanent") {
        bannedUntil = null;
      } else {
        const days = banDuration === "custom" ? parseInt(customDays) : parseInt(banDuration);
        if (isNaN(days) || days <= 0) {
          toast({
            variant: "destructive",
            title: "Invalid Duration",
            description: "Please enter a valid number of days.",
          });
          return;
        }
        const until = new Date();
        until.setDate(until.getDate() + days);
        bannedUntil = until.toISOString();
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          banned: true,
          banned_at: new Date().toISOString(),
          banned_until: bannedUntil,
          ban_reason: banReason || null,
          banned_by: user.id,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "User Banned",
        description: `User has been banned ${banDuration === "permanent" ? "permanently" : `for ${banDuration === "custom" ? customDays : banDuration} days`}.`,
      });

      setBanDialogOpen(false);
      checkAdminAndFetchProfiles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          banned: false,
          banned_at: null,
          banned_until: null,
          ban_reason: null,
          banned_by: null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User Unbanned",
        description: "User can now access the platform.",
      });

      checkAdminAndFetchProfiles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
        </div>

        <Card className="p-6 bg-gradient-card shadow-card border-border">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">User Management</h2>
            <p className="text-muted-foreground text-sm">
              Total Users: {profiles.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback>
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile.username}</p>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                            onClick={() => navigate(`/profile/${profile.id}`)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {profile.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {profile.banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                          <Ban className="w-3 h-3" />
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.banned ? (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(profile.id)}
                          >
                            Unban
                          </Button>
                          {profile.ban_reason && (
                            <p className="text-xs text-muted-foreground">
                              Reason: {profile.ban_reason}
                            </p>
                          )}
                          {profile.banned_until && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Until: {new Date(profile.banned_until).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openBanDialog(profile)}
                        >
                          Ban
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {selectedUser?.username} from the platform. Choose a duration and provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Ban Duration</Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {banDuration === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customDays">Number of Days</Label>
                <Input
                  id="customDays"
                  type="number"
                  min="1"
                  placeholder="Enter number of days"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
