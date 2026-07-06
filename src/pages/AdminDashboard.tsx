import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/apiClient";
import { LogOut, Plus, Users, Calendar, Award, Pencil, Trash2, User, Phone, Mail, Trash, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import collegeLogo from "@/assets/college-logo.png";
import PullToRefresh from "react-simple-pull-to-refresh";

const clubGradients = [
  "from-blue-500/10 to-cyan-500/10 border-cyan-500/30 text-cyan-950",
  "from-purple-500/10 to-pink-500/10 border-pink-500/30 text-pink-950",
  "from-amber-500/10 to-orange-500/10 border-orange-500/30 text-amber-950",
  "from-emerald-500/10 to-teal-500/10 border-teal-500/30 text-emerald-950",
  "from-rose-500/10 to-red-500/10 border-red-500/20 text-rose-950",
];

const AdminDashboard = () => {
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Form states
  const [clubForm, setClubForm] = useState({ name: "", description: "" });
  const [clubCoordinators, setClubCoordinators] = useState([{ name: "", phone: "", email: "", password: "" }]);
  const [coordinatorForm, setCoordinatorForm] = useState({
    full_name: "",
    email: "",
    password: "",
    club_id: "",
  });
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    email: "",
    roll_number: "",
    department: "",
    section: "",
    year: 1,
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Edit Club States
  const [isEditClubDialogOpen, setIsEditClubDialogOpen] = useState(false);
  const [selectedClubToEdit, setSelectedClubToEdit] = useState<any>(null);
  const [editClubForm, setEditClubForm] = useState({ name: "", description: "" });
  const [editClubCoordinators, setEditClubCoordinators] = useState([{ name: "", phone: "", email: "", password: "" }]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [visibleEditPasswords, setVisibleEditPasswords] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "admin")) {
      navigate("/login");
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const [clubsData, coordinatorsData, studentsData, eventsData] = await Promise.all([
        api.get("/api/clubs"),
        api.get("/api/auth/users/coordinators"),
        api.get("/api/auth/users/students"),
        api.get("/api/events"),
      ]);

      setClubs(clubsData || []);
      setCoordinators(coordinatorsData || []);
      setStudents(studentsData || []);
      setEvents(eventsData || []);
    } catch (err: any) {
      toast.error("Failed to load dashboard data: " + err.message);
    }
  };

  const handleAddCoordinatorRow = () => {
    setClubCoordinators([...clubCoordinators, { name: "", phone: "", email: "", password: "" }]);
  };

  const handleRemoveCoordinatorRow = (index: number) => {
    setClubCoordinators(clubCoordinators.filter((_, i) => i !== index));
  };

  const handleCoordinatorChange = (index: number, field: string, value: string) => {
    const updated = [...clubCoordinators];
    updated[index] = { ...updated[index], [field]: value };
    setClubCoordinators(updated);
  };

  const handleEditAddCoordinatorRow = () => {
    setEditClubCoordinators([...editClubCoordinators, { name: "", phone: "", email: "", password: "" }]);
  };

  const handleEditRemoveCoordinatorRow = (index: number) => {
    const updated = [...editClubCoordinators];
    updated.splice(index, 1);
    setEditClubCoordinators(updated);
  };

  const handleEditCoordinatorChange = (index: number, field: string, value: string) => {
    const updated = [...editClubCoordinators];
    updated[index] = { ...updated[index], [field]: value };
    setEditClubCoordinators(updated);
  };

  const handleStartEditClub = (club: any) => {
    setSelectedClubToEdit(club);
    setEditClubForm({ name: club.name || "", description: club.description || "" });
    setEditClubCoordinators(club.coordinators && club.coordinators.length > 0 
      ? club.coordinators.map((c: any) => ({ name: c.name || "", phone: c.phone || "", email: c.email || "", password: "" }))
      : [{ name: "", phone: "", email: "", password: "" }]
    );
    setIsEditClubDialogOpen(true);
  };

  const handleSaveEditClub = async () => {
    if (!editClubForm.name) {
      toast.error("Club Name is required");
      return;
    }
    
    // Filter out rows without a name
    const validCoordinators = editClubCoordinators.filter(c => c.name.trim().length > 0);

    try {
      await api.put(`/api/clubs/edit/${selectedClubToEdit.id}`, {
        name: editClubForm.name,
        description: editClubForm.description,
        coordinators: validCoordinators
      });
      toast.success("Club updated successfully!");
      setIsEditClubDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update club: " + err.message);
    }
  };

  const handleAddClub = async () => {
    if (!clubForm.name.trim()) {
      toast.error("Club name is required");
      return;
    }

    try {
      await api.post("/api/clubs", {
        name: clubForm.name,
        description: clubForm.description,
        coordinators: clubCoordinators.filter(c => c.name.trim() !== "")
      });
      
      toast.success("Club added successfully!");
      setClubForm({ name: "", description: "" });
      setClubCoordinators([{ name: "", phone: "", email: "", password: "" }]);
      setVisiblePasswords({});
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add club: " + error.message);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/clubs/${clubId}`);
      toast.success("Club deleted successfully!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete club: " + error.message);
    }
  };

  const handleAddCoordinator = async () => {
    try {
      await api.post("/api/auth/users", {
        email: coordinatorForm.email,
        password: coordinatorForm.password,
        full_name: coordinatorForm.full_name,
        role: "coordinator",
        club_id: coordinatorForm.club_id,
      });

      toast.success("Coordinator added successfully!");
      setCoordinatorForm({ full_name: "", email: "", password: "", club_id: "" });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add coordinator: " + error.message);
    }
  };

  const handleAddStudent = async () => {
    if (!studentForm.full_name || !studentForm.roll_number || !studentForm.email) {
      toast.error("Please fill in all required fields (Full Name, Roll Number, and Email)");
      return;
    }
    try {
      await api.post("/api/auth/users", {
        email: studentForm.email,
        password: studentForm.roll_number,
        full_name: studentForm.full_name,
        role: "student",
        roll_number: studentForm.roll_number,
        department: studentForm.department,
        section: studentForm.section,
        year: studentForm.year,
      });

      toast.success("Student added successfully!");
      setStudentForm({
        full_name: "",
        email: "",
        roll_number: "",
        department: "",
        section: "",
        year: 1,
      });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add student: " + error.message);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await api.put(`/api/auth/users/${editingUser.id}`, {
        full_name: editingUser.full_name,
        email: editingUser.email,
        roll_number: editingUser.roll_number,
        department: editingUser.department,
        section: editingUser.section,
        year: editingUser.year,
      });

      toast.success("User updated successfully!");
      setEditingUser(null);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update user: " + error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await api.delete(`/api/auth/users/${deleteUserId}`);

      toast.success("User deleted successfully!");
      setDeleteUserId(null);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete user: " + error.message);
    }
  };

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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <img src={collegeLogo} alt="College Logo" className="h-8 sm:h-12 md:h-16 w-auto object-contain flex-shrink-0 max-w-[180px] sm:max-w-xs" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-white/80 text-xs sm:text-sm mt-0.5">Manage clubs, coordinators, and students</p>
                  </div>
                </div>
                <Button onClick={signOut} variant="secondary" size="sm" className="gap-1.5 self-end sm:self-auto">
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Stats Overview */}
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
                  <Award className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{clubs.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Coordinators</CardTitle>
                  <Users className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{coordinators.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{students.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{events.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="clubs" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-4 max-w-full sm:max-w-2xl text-[11px] sm:text-sm h-10 sm:h-11">
                <TabsTrigger value="clubs" className="px-1.5 py-1">Clubs</TabsTrigger>
                <TabsTrigger value="coordinators" className="px-1.5 py-1">
                  <span className="hidden sm:inline">Coordinators</span>
                  <span className="sm:hidden">Coords</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="px-1.5 py-1">Students</TabsTrigger>
                <TabsTrigger value="events" className="px-1.5 py-1">Events</TabsTrigger>
              </TabsList>

              <TabsContent value="clubs" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Clubs</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Add Club
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Club</DialogTitle>
                        <DialogDescription>Create a new club for students to join</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="clubName">Club Name</Label>
                          <Input
                            id="clubName"
                            value={clubForm.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClubForm({ ...clubForm, name: e.target.value })}
                            placeholder="e.g., Coding Club"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clubDesc">Description</Label>
                          <Textarea
                            id="clubDesc"
                            value={clubForm.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClubForm({ ...clubForm, description: e.target.value })}
                            placeholder="Enter club description"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-semibold">Club Coordinators</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddCoordinatorRow} className="text-xs h-7 gap-1">
                              <Plus className="w-3 h-3" /> Add Coordinator
                            </Button>
                          </div>
                          
                          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                            {clubCoordinators.map((coord, index) => (
                              <div key={index} className="p-3 border rounded-lg space-y-2 relative bg-muted/25">
                                {clubCoordinators.length > 1 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleRemoveCoordinatorRow(index)}
                                    className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <div className="space-y-1">
                                  <Label className="text-xs">Name *</Label>
                                  <Input
                                    value={coord.name}
                                    onChange={(e) => handleCoordinatorChange(index, 'name', e.target.value)}
                                    placeholder="Coordinator full name"
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Phone</Label>
                                    <Input
                                      value={coord.phone}
                                      onChange={(e) => handleCoordinatorChange(index, 'phone', e.target.value)}
                                      placeholder="Phone"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Email</Label>
                                    <Input
                                      value={coord.email}
                                      onChange={(e) => handleCoordinatorChange(index, 'email', e.target.value)}
                                      placeholder="Email"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Password</Label>
                                    <div className="relative">
                                      <Input
                                        type={visiblePasswords[index] ? "text" : "password"}
                                        value={coord.password || ""}
                                        onChange={(e) => handleCoordinatorChange(index, 'password', e.target.value)}
                                        placeholder="Password"
                                        className="h-8 text-xs pr-8"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setVisiblePasswords({ ...visiblePasswords, [index]: !visiblePasswords[index] })}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                      >
                                        {visiblePasswords[index] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button onClick={handleAddClub} className="w-full">
                          Add Club
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clubs.map((club, idx) => (
                    <Card key={club.id} className={`bg-gradient-to-br ${clubGradients[idx % clubGradients.length]} backdrop-blur-md border shadow-card flex flex-col justify-between hover:shadow-button hover:scale-[1.01] transition-all duration-300`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">{club.name}</CardTitle>
                            {club.description && <CardDescription className="mt-1.5 text-xs sm:text-sm line-clamp-3">{club.description}</CardDescription>}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="outline" size="icon" onClick={() => handleStartEditClub(club)} className="h-8 w-8" title="Edit Club">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteClub(club.id)} className="h-8 w-8" title="Delete Club">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
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
                </div>
              </TabsContent>

              <TabsContent value="coordinators" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Coordinators</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Add Coordinator
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Coordinator</DialogTitle>
                        <DialogDescription>Create a coordinator and assign to a club</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={coordinatorForm.full_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCoordinatorForm({ ...coordinatorForm, full_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={coordinatorForm.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCoordinatorForm({ ...coordinatorForm, email: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={coordinatorForm.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCoordinatorForm({ ...coordinatorForm, password: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Assign to Club</Label>
                          <Select
                            value={coordinatorForm.club_id}
                            onValueChange={(value: string) =>
                              setCoordinatorForm({ ...coordinatorForm, club_id: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a club" />
                            </SelectTrigger>
                            <SelectContent>
                              {clubs.map((club) => (
                                <SelectItem key={club.id} value={club.id}>
                                  {club.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddCoordinator} className="w-full">
                          Add Coordinator
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {coordinators.map((coordinator) => (
                    <Card key={coordinator.id} className="shadow-card">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{coordinator.full_name}</CardTitle>
                            <CardDescription>{coordinator.email}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEditUser(coordinator)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => setDeleteUserId(coordinator.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Students</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>Register a new student</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={studentForm.full_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, full_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Roll Number * (Also becomes password)</Label>
                          <Input
                            value={studentForm.roll_number}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, roll_number: e.target.value.toUpperCase() })
                            }
                            placeholder="e.g., 22AD001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email Address *</Label>
                          <Input
                            type="email"
                            value={studentForm.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, email: e.target.value })
                            }
                            placeholder="e.g., name@domain.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Input
                            value={studentForm.department}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, department: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Section</Label>
                          <Input
                            value={studentForm.section}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, section: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Select
                            value={studentForm.year.toString()}
                            onValueChange={(value: string) =>
                              setStudentForm({ ...studentForm, year: parseInt(value) })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1st Year</SelectItem>
                              <SelectItem value="2">2nd Year</SelectItem>
                              <SelectItem value="3">3rd Year</SelectItem>
                              <SelectItem value="4">4th Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddStudent} className="w-full">
                          Add Student
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {students.map((student) => (
                    <Card key={student.id} className="shadow-card">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{student.full_name}</CardTitle>
                            <CardDescription>
                              {student.email} • {student.roll_number} • {student.department} • {student.section} • Year{" "}
                              {student.year}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEditUser(student)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => setDeleteUserId(student.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <h2 className="text-2xl font-bold">All Events</h2>
                <div className="space-y-4">
                  {events.map((event) => (
                    <Card key={event.id} className={`bg-white/70 border border-white/50 border-l-4 ${event.category?.toLowerCase() === 'technical' ? 'border-l-blue-500' : event.category?.toLowerCase() === 'cultural' ? 'border-l-purple-500' : event.category?.toLowerCase() === 'sports' ? 'border-l-emerald-500' : 'border-l-amber-500'} backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300`}>
                      <CardHeader>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription>
                          {event.clubs?.name} • Coordinator: {event.profiles?.full_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.event_date).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PullToRefresh>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editingUser.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingUser({ ...editingUser, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingUser.email || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>
              {editingUser.role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input
                      value={editingUser.roll_number || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingUser({ ...editingUser, roll_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={editingUser.department || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingUser({ ...editingUser, department: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Input
                      value={editingUser.section || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingUser({ ...editingUser, section: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={editingUser.year?.toString()}
                      onValueChange={(value: string) =>
                        setEditingUser({ ...editingUser, year: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <Button onClick={handleUpdateUser} className="w-full">
                Update User
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open: boolean) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Club Dialog */}
      <Dialog open={isEditClubDialogOpen} onOpenChange={setIsEditClubDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Club: {selectedClubToEdit?.name}</DialogTitle>
            <DialogDescription>Modify club details and coordinators</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Club Name *</Label>
              <Input
                value={editClubForm.name}
                onChange={(e) => setEditClubForm({ ...editClubForm, name: e.target.value })}
                placeholder="Enter club name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editClubForm.description}
                onChange={(e) => setEditClubForm({ ...editClubForm, description: e.target.value })}
                placeholder="Enter club description"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Club Coordinators</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleEditAddCoordinatorRow} className="text-xs h-7 gap-1">
                  <Plus className="w-3 h-3" /> Add Coordinator
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {editClubCoordinators.map((coord, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2 relative bg-muted/25">
                    {editClubCoordinators.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditRemoveCoordinatorRow(index)}
                        className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Name *</Label>
                      <Input
                        value={coord.name}
                        onChange={(e) => handleEditCoordinatorChange(index, 'name', e.target.value)}
                        placeholder="Coordinator full name"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          value={coord.phone}
                          onChange={(e) => handleEditCoordinatorChange(index, 'phone', e.target.value)}
                          placeholder="Phone"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          value={coord.email}
                          onChange={(e) => handleEditCoordinatorChange(index, 'email', e.target.value)}
                          placeholder="Email"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Password</Label>
                        <div className="relative">
                          <Input
                            type={visibleEditPasswords[index] ? "text" : "password"}
                            value={coord.password || ""}
                            onChange={(e) => handleEditCoordinatorChange(index, 'password', e.target.value)}
                            placeholder="Leave blank to keep unchanged"
                            className="h-8 text-xs pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setVisibleEditPasswords({ ...visibleEditPasswords, [index]: !visibleEditPasswords[index] })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            {visibleEditPasswords[index] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveEditClub} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
