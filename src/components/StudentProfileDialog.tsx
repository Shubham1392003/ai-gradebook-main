import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User } from "lucide-react";

export const StudentProfileDialog = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const [fullName, setFullName] = useState("");
    const [regNumber, setRegNumber] = useState("");
    const [division, setDivision] = useState("");
    const [gender, setGender] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && open) {
            setFullName(user.user_metadata?.full_name || "");
            setRegNumber(user.user_metadata?.reg_number || "");
            setDivision(user.user_metadata?.division || "");
            setGender(user.user_metadata?.gender || "");
        }
    }, [user, open]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    reg_number: regNumber,
                    division: division,
                    gender: gender,
                }
            });

            if (error) throw error;

            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved successfully.",
            });

            // Update local context manually so changes reflect immediately
            user.user_metadata.full_name = fullName;
            user.user_metadata.reg_number = regNumber;
            user.user_metadata.division = division;
            user.user_metadata.gender = gender;

            setOpen(false);
        } catch (error: any) {
            toast({
                title: "Failed to update profile",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Student Profile
                    </DialogTitle>
                    <DialogDescription>
                        View and update your student profile details.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="regNumber">Registration Number</Label>
                        <Input
                            id="regNumber"
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value)}
                            placeholder="e.g. REG-2023-001"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="division">Division</Label>
                            <Input
                                id="division"
                                value={division}
                                onChange={(e) => setDivision(e.target.value)}
                                placeholder="e.g. A"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                    <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {saving ? "Saving..." : "Save Profile"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
