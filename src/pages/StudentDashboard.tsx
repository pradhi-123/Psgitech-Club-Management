import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import api from "@/lib/apiClient";
import { Award, Calendar, LogOut, Trophy, Users, Download, User, Phone, Bell, BellOff, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import collegeLogo from "@/assets/college-logo.png";
import PullToRefresh from "react-simple-pull-to-refresh";

const clubGradients = [
  "from-blue-500/10 to-cyan-500/10 border-cyan-500/30 text-cyan-950",
  "from-purple-500/10 to-pink-500/10 border-pink-500/30 text-pink-950",
  "from-amber-500/10 to-orange-500/10 border-orange-500/30 text-amber-950",
  "from-emerald-500/10 to-teal-500/10 border-teal-500/30 text-emerald-950",
  "from-rose-500/10 to-red-500/10 border-red-500/20 text-rose-950",
];

const StudentDashboard = () => {
  const { profile, signOut, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState({ total_points: 0, events_attended: 0, badges_earned: 0 });
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState<string>("");

  // Search/Filter states
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogClubFilter, setCatalogClubFilter] = useState("all");

  // Notification States
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [isUpdatePhoneOpen, setIsUpdatePhoneOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (profile) {
      setNewPhoneNumber(profile.phone && profile.phone !== "Unavailable" ? profile.phone : "");
      setNewEmail(profile.email && !profile.email.endsWith('@psgitech.ac.in') && profile.email !== "Unavailable" ? profile.email : "");
    }
  }, [profile]);

  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("dismissed_notifications") || "[]");
  });

  const handleDismissNotification = (id: string) => {
    const updated = [...dismissedNotifications, id];
    setDismissedNotifications(updated);
    localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
  };

  const handleDismissAllNotifications = () => {
    const allIds = activeNotifications.map(n => n.id);
    const updated = Array.from(new Set([...dismissedNotifications, ...allIds]));
    setDismissedNotifications(updated);
    localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
  };

  // Compile active notifications
  const activeNotifications = (() => {
    const list: Array<{ id: string; title: string; message: string; date: string; type: 'volunteer' | 'recent' }> = [];
    if (!profile) return list;

    const roll = profile.roll_number?.trim().toLowerCase();

    events.forEach(event => {
      // 1. Check if user is a volunteer for this event
      const vols = event.volunteers ? event.volunteers.split(',').map((s: string) => s.trim().toLowerCase()) : [];
      if (roll && vols.includes(roll)) {
        list.push({
          id: `volunteer-${event.id}`,
          title: "Volunteer Assignment 🙋",
          message: `You have been registered as a volunteer for "${event.name}" by ${event.clubs?.name || 'the club'} on ${new Date(event.event_date).toLocaleDateString()}.`,
          date: event.created_at || event.event_date,
          type: 'volunteer'
        });
      }

      // 2. Check if event is recent (created in last 7 days)
      const createdAt = event.created_at ? new Date(event.created_at).getTime() : 0;
      const isRecentEvent = Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000;
      if (isRecentEvent) {
        list.push({
          id: `recent-${event.id}`,
          title: "New Event Announced 📢",
          message: `"${event.name}" has been announced by ${event.clubs?.name || 'the club'}, scheduled for ${new Date(event.event_date).toLocaleDateString()} at ${new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          date: event.created_at || event.event_date,
          type: 'recent'
        });
      }
    });

    // Filter out dismissed notifications
    return list.filter(n => !dismissedNotifications.includes(n.id));
  })();

  const unreadCount = activeNotifications.length;

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "student")) {
      navigate("/login");
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const [creditsData, clubsData, eventsData, myEventsData] = await Promise.all([
        api.get("/api/events/students/credits"),
        api.get("/api/clubs"),
        api.get("/api/events"),
        api.get("/api/events/my-registrations")
      ]);

      if (creditsData) setCredits(creditsData);
      setClubs(clubsData || []);
      setEvents(eventsData || []);
      setMyEvents(myEventsData || []);
    } catch (error: any) {
      toast.error("Failed to load student data: " + error.message);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.put("/api/auth/profile", { phone: newPhoneNumber, email: newEmail });
      toast.success("Profile details updated successfully!");
      setIsUpdatePhoneOpen(false);
      fetchData();
      await refreshProfile();
    } catch (err: any) {
      toast.error("Failed to update profile: " + err.message);
    }
  };

  const showConfirmDialog = (eventId: string) => {
    // Check if already registered
    const isRegistered = myEvents.some(reg => reg.event_id === eventId);
    if (isRegistered) {
      toast.error("You are already registered for this event!");
      return;
    }

    // Check if user is a volunteer for this event
    const eventObj = events.find(e => e.id === eventId);
    const vols = eventObj?.volunteers ? eventObj.volunteers.split(',').map((s: string) => s.trim().toLowerCase()) : [];
    if (profile?.roll_number && vols.includes(profile.roll_number.toLowerCase())) {
      toast.error("You are listed as a volunteer for this event and cannot register as a participant.");
      return;
    }

    setSelectedEventId(eventId);
    setConfirmDialogOpen(true);
  };

  const handleRegisterEvent = async () => {
    if (!profile?.id || !selectedEventId) return;

    try {
      await api.post("/api/events/register", { eventId: selectedEventId });
      setConfirmDialogOpen(false);
      toast.success("Successfully registered for the event!");
      fetchData(); // Refresh data
    } catch (error: any) {
      setConfirmDialogOpen(false);
      toast.error("Failed to register: " + error.message);
    }
  };

  const showQrCode = (qrCode: string) => {
    setSelectedQrCode(qrCode);
    setQrDialogOpen(true);
  };

  const handleDownloadCertificate = async (registration: any) => {
    try {
      const data = await api.post("/api/events/certificates/generate", { registrationId: registration.id });
      const cert = data.certificate;
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // 1. Background fill (soft off-white cream)
      doc.setFillColor(252, 251, 249);
      doc.rect(0, 0, 297, 210, 'F');

      // 2. Thick Navy Blue outer frame
      doc.setDrawColor(15, 30, 54);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, 277, 180, 'S');

      // 3. Thin Amber Gold inner frame
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.6);
      doc.rect(13, 13, 271, 174, 'S');

      // 4. Corner Ornaments (Gold accent corner lines)
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      // Top-Left Corner
      doc.line(16, 16, 26, 16);
      doc.line(16, 16, 16, 26);
      // Top-Right Corner
      doc.line(281, 16, 271, 16);
      doc.line(281, 16, 281, 26);
      // Bottom-Left Corner
      doc.line(16, 184, 26, 184);
      doc.line(16, 184, 16, 174);
      // Bottom-Right Corner
      doc.line(281, 184, 271, 184);
      doc.line(281, 184, 281, 174);

      // 5. Add Logo (Centered)
      const logoWidth = 80;
      const logoHeight = 12;
      const logoX = 148.5 - (logoWidth / 2);
      const logoY = 18;
      doc.addImage(collegeLogo, 'PNG', logoX, logoY, logoWidth, logoHeight);

      // 6. College Header
      doc.setFont('times', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 30, 54); // Navy Blue
      doc.text('PSG Institute of Technology and Applied Research', 148.5, 40, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 110, 120);
      doc.text('COIMBATORE - 641 062 | TAMIL NADU, INDIA', 148.5, 46, { align: 'center' });

      // 7. Decorative line
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.line(100, 50, 197, 50);

      // 8. Certificate Title & Type mapping
      const isVolCert = cert.certificateType === 'volunteer';
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(isVolCert ? 22 : 24);
      doc.setTextColor(180, 140, 60); // Gold tone
      doc.text(isVolCert ? 'Certificate of Volunteer Service' : 'Certificate of Participation', 148.5, 68, { align: 'center' });

      // 9. Presentation phrase
      doc.setFont('helvetica', 'oblique');
      doc.setFontSize(11);
      doc.setTextColor(80, 85, 90);
      doc.text('This is to certify that', 148.5, 78, { align: 'center' });

      // 10. Student Name
      doc.setFont('times', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 30, 54); // Navy Blue
      doc.text(cert.studentName.toUpperCase(), 148.5, 89, { align: 'center' });

      // 11. Student details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(60, 65, 70);
      doc.text(
        `Roll No: ${cert.rollNumber}  |  Dept: ${cert.department}  |  Year: ${cert.year}  |  Section: ${cert.section}`,
        148.5,
        97,
        { align: 'center' }
      );

      // 12. Achievement Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(80, 85, 90);
      doc.text(isVolCert ? 'has successfully served as a Student Volunteer for' : 'has active participation in the event', 148.5, 107, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 30, 54);
      doc.text(`"${cert.eventName}"`, 148.5, 116, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(60, 65, 70);
      doc.text(
        `Organized by the ${cert.clubName} at PSG iTech on ${cert.issuedDate}.`,
        148.5,
        124,
        { align: 'center' }
      );

      // 13. Credit Points Frame
      doc.setDrawColor(212, 175, 55);
      doc.setFillColor(255, 252, 240);
      doc.setLineWidth(0.3);
      doc.rect(103, 130, 91, 8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 140, 60);
      doc.text(`${isVolCert ? 'VOLUNTEER' : 'CREDIT'} POINTS EARNED: ${cert.creditPoints}`, 148.5, 135.5, { align: 'center' });

      // 14. Signatures
      // Left side: Coordinator
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.4);
      doc.line(40, 158, 90, 158);

      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(15, 30, 54);
      doc.text(cert.coordinators || 'Club Coordinator', 65, 154, { align: 'center' }); // Faux signature

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text('Club Coordinator(s)', 65, 163, { align: 'center' });

      // Right side: Principal
      doc.line(207, 158, 257, 158);

      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(15, 30, 54);
      doc.text('Dr. Saravanakumar', 232, 154, { align: 'center' }); // Faux signature

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text('Principal, PSG iTech', 232, 163, { align: 'center' });

      // 15. Certificate Metadata
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 145, 150);
      doc.text(`Certificate ID: ${cert.certificateId}  |  Issued: ${cert.issuedDate}`, 148.5, 174, { align: 'center' });

      doc.save(`Certificate_${cert.studentName.replace(/\s+/g, '_')}_${cert.certificateId}.pdf`);
      toast.success("Certificate downloaded successfully!");
    } catch (error: any) {
      toast.error("Failed to generate certificate: " + error.message);
    }
  };

  // Filter computations
  const filteredCatalogEvents = events.filter(e => {
    const matchesSearch = e.name?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      e.description?.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesClub = catalogClubFilter === "all" || e.club_id === catalogClubFilter;
    return matchesSearch && matchesClub;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PullToRefresh onRefresh={fetchData} pullingContent="">
        <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 via-purple-100 to-amber-100">
          {/* Header */}
          <header className="bg-gradient-primary text-white shadow-lg">
            <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <img src={collegeLogo} alt="College Logo" className="h-8 sm:h-12 md:h-16 w-auto object-contain flex-shrink-0 max-w-[180px] sm:max-w-xs" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">Welcome, {profile?.full_name}!</h1>
                    <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1">
                      {profile?.department} • {profile?.section} • Year {profile?.year} • Phone: {profile?.phone || "Unavailable"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    onClick={() => setNotificationDialogOpen(true)}
                    variant="secondary"
                    size="sm"
                    className="relative gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 sm:w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                    <span className="hidden sm:inline">Notifications</span>
                  </Button>

                  <Dialog open={isUpdatePhoneOpen} onOpenChange={setIsUpdatePhoneOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="gap-1.5 sm:gap-2">
                        <User className="w-3.5 h-3.5 sm:w-4 h-4" />
                        <span className="hidden sm:inline">Update Profile</span>
                        <span className="sm:hidden">Profile</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Update Profile Details</DialogTitle>
                        <DialogDescription>Update your contact phone number and email address below.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="text-slate-700">Phone Number</Label>
                          <Input
                            type="tel"
                            value={newPhoneNumber}
                            onChange={(e) => setNewPhoneNumber(e.target.value)}
                            placeholder="Enter new phone number"
                            className="text-slate-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700">Email Address</Label>
                          <Input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter new email address"
                            className="text-slate-800"
                          />
                        </div>
                        <Button onClick={handleUpdateProfile} className="w-full bg-gradient-primary">
                          Save Profile Details
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button onClick={signOut} variant="secondary" size="sm" className="gap-1.5 sm:gap-2">
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Exit</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:shadow-button hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                  <Trophy className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{credits.total_points}</div>
                  <p className="text-xs text-muted-foreground mt-1">Keep earning!</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:shadow-button hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
                  <Calendar className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">{credits.events_attended}</div>
                  <p className="text-xs text-muted-foreground mt-1">Great participation!</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:shadow-button hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                  <Award className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{credits.badges_earned}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {5 - (credits.total_points % 5)} points to next badge
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Badges Cabinet / Achievements */}
            <Card className="mb-6 sm:mb-8 border border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5 shadow-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Achievements Cabinet
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Earn 5 points to unlock the next level badge! Current points: {credits.total_points}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 text-center">
                  {[
                    { level: 1, name: "Bronze Pioneer", points: 5, color: "from-amber-600 to-amber-800", icon: "🥉" },
                    { level: 2, name: "Silver Explorer", points: 10, color: "from-slate-300 to-slate-500", icon: "🥈" },
                    { level: 3, name: "Golden Achiever", points: 15, color: "from-yellow-400 to-amber-500", icon: "🥇" },
                    { level: 4, name: "Platinum Leader", points: 20, color: "from-indigo-300 to-purple-500", icon: "⚡" },
                    { level: 5, name: "Diamond Master", points: 25, color: "from-cyan-300 to-blue-500", icon: "💎" },
                    { level: 6, name: "Grand Champion", points: 30, color: "from-rose-400 to-red-600", icon: "👑" },
                  ].map((badge) => {
                    const isUnlocked = credits.total_points >= badge.points;
                    return (
                      <div
                        key={badge.level}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isUnlocked
                          ? "bg-card border-amber-500/30 shadow-md scale-100 opacity-100 hover:scale-105 hover:shadow-lg duration-300"
                          : "bg-muted/30 border-muted opacity-40 grayscale"
                          }`}
                      >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${badge.color} text-white flex items-center justify-center text-xl shadow-inner mb-2`}>
                          {badge.icon}
                        </div>
                        <p className="font-bold text-xs truncate max-w-full text-foreground">{badge.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{badge.points} Points</p>
                        <Badge variant={isUnlocked ? "default" : "secondary"} className="mt-2 text-[9px] px-1.5 py-0">
                          {isUnlocked ? "Unlocked" : "Locked"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs defaultValue="events" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 max-w-full sm:max-w-md text-xs sm:text-sm">
                <TabsTrigger value="events" className="px-2 py-1.5 sm:px-3 sm:py-2">
                  <span className="hidden sm:inline">Upcoming Events</span>
                  <span className="sm:hidden">Events</span>
                </TabsTrigger>
                <TabsTrigger value="clubs" className="px-2 py-1.5 sm:px-3 sm:py-2">Clubs</TabsTrigger>
                <TabsTrigger value="my-events" className="px-2 py-1.5 sm:px-3 sm:py-2">
                  <span className="hidden sm:inline">My Events</span>
                  <span className="sm:hidden">Mine</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="events" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 pb-2 w-full sm:max-w-2xl animate-fadeIn">
                  <Input
                    placeholder="Search events by name or description..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="bg-white/80 backdrop-blur-sm border-slate-200 flex-1"
                  />
                  <Select value={catalogClubFilter} onValueChange={setCatalogClubFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Filter by Club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      {clubs.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCatalogEvents.filter(event => new Date(event.event_date) >= new Date()).length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No upcoming events found matching your search.
                      </CardContent>
                    </Card>
                  ) : (
                    filteredCatalogEvents.filter(event => new Date(event.event_date) >= new Date()).map((event) => (
                      <Card key={event.id} className={`bg-white/70 border border-white/50 border-l-4 ${event.category?.toLowerCase() === 'technical' ? 'border-l-blue-500' : event.category?.toLowerCase() === 'cultural' ? 'border-l-purple-500' : event.category?.toLowerCase() === 'sports' ? 'border-l-emerald-500' : 'border-l-amber-500'} backdrop-blur-sm shadow-card hover:shadow-button hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between`}>
                        <CardHeader className="pb-3 sm:pb-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-xl mb-1">{event.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{event.clubs?.name}</span>
                              </CardDescription>
                            </div>
                            <Badge className="bg-gradient-primary text-white text-xs shrink-0">
                              {event.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 mt-auto">
                          {event.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="text-xs sm:text-sm space-y-0.5">
                              <p className="font-semibold text-slate-700">
                                {new Date(event.event_date).toLocaleDateString()} at{" "}
                                {new Date(event.event_date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-muted-foreground text-[11px] sm:text-xs">
                                {event.duration} mins • {event.credit_points} pts
                              </p>
                            </div>
                            <Button size="sm" onClick={() => showConfirmDialog(event.id)} className="w-full sm:w-auto bg-gradient-primary">
                              Register
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="clubs" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {clubs.map((club, idx) => (
                  <Card key={club.id} className={`bg-gradient-to-br ${clubGradients[idx % clubGradients.length]} backdrop-blur-md border shadow-card hover:shadow-button hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between`}>
                    <CardHeader className="pb-3">
                      <CardTitle>{club.name}</CardTitle>
                      <CardDescription>{club.description}</CardDescription>
                    </CardHeader>
                    {club.coordinators && club.coordinators.length > 0 && (
                      <CardContent className="pt-0 pb-5 text-sm text-muted-foreground mt-auto">
                        <div className="border-t border-muted/65 pt-3 space-y-3.5">
                          <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Club Coordinators</p>
                          <div className="space-y-3">
                            {club.coordinators.map((coord: any, idx: number) => (
                              <div key={idx} className="space-y-1 border-l-2 border-primary/50 pl-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="font-medium text-foreground text-xs sm:text-sm">{coord.name}</span>
                                </div>
                                {coord.phone && (
                                  <div className="flex items-center gap-2 pl-5">
                                    <Phone className="w-3 h-3 text-secondary shrink-0" />
                                    <span className="text-[11px] sm:text-xs">{coord.phone}</span>
                                  </div>
                                )}
                                {coord.email && (
                                  <div className="flex items-center gap-2 pl-5 min-w-0">
                                    <Mail className="w-3 h-3 text-accent shrink-0" />
                                    <span className="text-[11px] sm:text-xs truncate min-w-0 flex-1">{coord.email}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="my-events" className="space-y-4">
                {myEvents.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      You haven't registered for any events yet.
                    </CardContent>
                  </Card>
                ) : (
                  myEvents.map((registration) => (
                    <Card key={registration.id} className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">{registration.events?.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{registration.events?.clubs?.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            {registration.is_volunteer ? (
                              <Badge className="text-xs bg-amber-500 hover:bg-amber-600 text-white">
                                Volunteer
                              </Badge>
                            ) : (
                              <Badge
                                variant={registration.attendance_confirmed ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {registration.attendance_confirmed ? "Attended" : "Registered"}
                              </Badge>
                            )}
                            {registration.points_awarded > 0 && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Points: {registration.points_awarded}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {registration.qr_code && !registration.attendance_confirmed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => showQrCode(registration.qr_code)}
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              >
                                View QR
                              </Button>
                            )}
                            {registration.attendance_confirmed && (
                              <Button
                                variant={registration.is_volunteer ? "secondary" : "default"}
                                size="sm"
                                className={`gap-1.5 w-full sm:w-auto text-xs sm:text-sm ${registration.is_volunteer
                                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                                  : ""
                                  }`}
                                onClick={() => handleDownloadCertificate(registration)}
                              >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">
                                  {registration.is_volunteer ? "Download Volunteer Certificate" : "Download Certificate"}
                                </span>
                                <span className="sm:hidden">
                                  {registration.is_volunteer ? "Volunteer Cert" : "Certificate"}
                                </span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PullToRefresh>

      {/* Registration Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Event Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to register for this event? You'll receive a QR code for attendance verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegisterEvent}>Confirm Registration</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Display Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Your Event QR Code</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Show this QR code to the coordinator for attendance verification.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4 sm:py-6">
            <QRCodeSVG value={selectedQrCode} size={Math.min(256, window.innerWidth * 0.6)} level="H" />
          </div>
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>Keep this QR code safe and present it at the event.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-xl flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </DialogTitle>
            <DialogDescription>
              Stay updated with recent club announcements and volunteer assignments.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {unreadCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                <BellOff className="w-10 h-10 mb-2 opacity-50 text-muted-foreground" />
                <p className="text-sm font-medium">No new notifications</p>
                <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <p className="text-xs font-semibold text-muted-foreground">{unreadCount} Active Notifications</p>
                  <Button variant="ghost" size="sm" onClick={handleDismissAllNotifications} className="text-xs h-8 px-2">
                    Dismiss All
                  </Button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
                  {activeNotifications.map((notif) => (
                    <Card key={notif.id} className="p-3.5 relative hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start gap-2 pr-6">
                        <div className="space-y-1">
                          <p className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDismissNotification(notif.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentDashboard;
