import { useEffect, useState } from "react";
import { getCurrentUser, getUserAcademicProfile } from "../../services/profileService";
import ProfileCompletionModal from "./ProfileCompletionModal";

export default function ProfileCompletionGate({ children }) {
  const [user, setUser] = useState(null);
  const [academic, setAcademic] = useState(null);
  const [checking, setChecking] = useState(true);
  const [required, setRequired] = useState(false);

  const load = async () => {
    const token = localStorage.getItem("noteswala_access_token");
    if (!token) { setChecking(false); return; }

    try {
      const userResponse = await getCurrentUser();
      const currentUser = userResponse.data?.data || null;
      setUser(currentUser);

      if (!currentUser?.userId) return;
      try {
        const profileResponse = await getUserAcademicProfile(currentUser.userId);
        const profile = profileResponse.data?.data || null;
        setAcademic(profile);
        setRequired(!profile?.profileCompleted);
      } catch (error) {
        if (error?.response?.status === 404) setRequired(true);
        else setRequired(true);
      }
    } catch {
      setRequired(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (checking || required) {
    return <>
      {children}
      {required && user && (
        <ProfileCompletionModal
          user={user}
          academic={academic}
          onCompleted={async () => {
            await load();
          }}
        />
      )}
    </>;
  }

  return children;
}
