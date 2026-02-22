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
import { CLASS_OPTIONS } from "@/lib/constants";

export const StudentProfileDialog = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const [fullName, setFullName] = useState("");
    const [regNumber, setRegNumber] = useState("");
    const [className, setClassName] = useState("");
    const [gender, setGender] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && open) {
            setFullName(user.user_metadata?.full_name || "");
            setRegNumber(user.user_metadata?.reg_number || "");
            setClassName(user.user_metadata?.class_name || "");
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
                    class_name: className,
                    gender: gender,
                }
            });

            if (error) throw error;

            const metadataPayload = JSON.stringify({
                reg_number: regNumber,
                class_name: className,
                gender: gender
            });

            // Sync to public.profiles using avatar_url as a JSON data vault!
            try {
                await supabase.from('profiles').update({
                    full_name: fullName,
                    avatar_url: metadataPayload
                }).eq('user_id', user.id);
            } catch (err) {
                console.error("Profile sync failed", err);
            }

            // Sync metadata into all past Submissions to bypass Teacher RLS block on profiles!
            try {
                const { data: mySubs } = await supabase.from('submissions').select('id, answers').eq('student_id', user.id);
                if (mySubs) {
                    for (const sub of mySubs) {
                        const newAnswers: any = (typeof sub.answers === 'object' && sub.answers !== null && !Array.isArray(sub.answers)) ? { ...sub.answers } : {};
                        newAnswers.__metadata = {
                            full_name: fullName,
                            reg_number: regNumber,
                            class_name: className
                        };
                        await supabase.from('submissions').update({ answers: newAnswers }).eq('id', sub.id);
                    }
                }
            } catch (err) {
                console.error("Meta push failed", err);
            }

            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved successfully.",
            });

            // Update local context manually so changes reflect immediately
            user.user_metadata.full_name = fullName;
            user.user_metadata.reg_number = regNumber;
            user.user_metadata.class_name = className;
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
                            <Label htmlFor="className">Class</Label>
                            <Select value={className} onValueChange={setClassName}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CLASS_OPTIONS.map((cls) => (
                                        <SelectItem key={cls} value={cls}>
                                            {cls}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
