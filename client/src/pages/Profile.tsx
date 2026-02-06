import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { User, BookOpen, BookMarked, Bell, Download, Settings, Lock } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Profile: React.FC = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-content-frame rounded-lg border border-border overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm bg-primary/10 text-primary border-l-4 border-primary">
              <User className="h-4 w-4" />
              <span className="flex-1 text-left">Profile</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-muted/50 hover:text-white">
              <BookOpen className="h-4 w-4" />
              <span className="flex-1 text-left">Continue Reading</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-muted/50 hover:text-white">
              <BookMarked className="h-4 w-4" />
              <span className="flex-1 text-left">Bookmark</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-muted/50 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="flex-1 text-left">Notification</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-muted/50 hover:text-white">
              <Download className="h-4 w-4" />
              <span className="flex-1 text-left">Import & Export</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-muted/50 hover:text-white">
              <Settings className="h-4 w-4" />
              <span className="flex-1 text-left">Settings</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-content-frame rounded-lg border border-border p-6 md:p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{user.username}</h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>

            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <Input value={user.username} disabled className="bg-muted/30 border-gray-700/50 text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <Input value={user.email} disabled className="bg-muted/30 border-gray-700/50 text-white" />
              </div>

              <div className="pt-4 border-t border-gray-700/50">
                <div className="flex items-center gap-2 mb-4 text-blue-400">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">Change Password (coming soon)</span>
                </div>
              </div>

              <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8">
                Save Changes
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default Profile;
