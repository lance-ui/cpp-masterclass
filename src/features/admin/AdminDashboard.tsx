import React from 'react';
import {
  Users, 
  Folder,
  Video,
  FileText
} from 'lucide-react';
import { CourseModule, User, UserRole } from '@/types';
import { Card, ProgressBar, StatCard } from '@/components/ui';

interface AdminDashboardProps {
  modules: CourseModule[];
  allUsers: User[];
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  modules,
  allUsers,
  onUpdateUserRole
}) => {
  const totalVideos = modules.reduce((acc, m) => acc + m.videos.length, 0);
  const totalDocs = modules.reduce((acc, m) => acc + m.documents.length, 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Course administration
          </h1>
          <p className="text-xs text-slate-500">
            Review course materials and manage learner roles.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Course media and modules are securely managed and served within the platform.
        </p>
      </div>

      {/* Course Stats Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Folder className="w-6 h-6 text-brand-500" />}
          label="Total Modules"
          value={modules.length}
          subValue="Structured curriculum topics"
        />

        <StatCard
          icon={<Video className="w-6 h-6 text-red-500" />}
          label="Video Lectures"
          value={totalVideos}
          subValue="Direct streamable lessons"
        />

        <StatCard
          icon={<FileText className="w-6 h-6 text-cyan-500" />}
          label="PDF References"
          value={totalDocs}
          subValue="Embedded technical slides"
        />

        <StatCard
          icon={<Users className="w-6 h-6 text-purple-500" />}
          label="Learner Records"
          value={allUsers.length}
          subValue="Enrolled user profiles"
        />
      </div>

      {/* User Accounts Management Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              User Accounts & Role Permissions
            </h3>
            <p className="text-xs text-slate-500">
              Change roles for learner records stored in this browser.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {allUsers.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase font-mono">
              <tr>
                <th className="px-6 py-3">Learner Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Completed Modules</th>
                <th className="px-6 py-3">Current Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    No learner records yet.
                  </td>
                </tr>
              )}
              {allUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3.5 font-medium flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <span>{user.name}</span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {user.completedModuleIds.length} / {modules.length}
                    </span>
                    <ProgressBar
                      value={user.completedModuleIds.length}
                      max={modules.length}
                      label={`${user.name} course completion`}
                      className="mt-1 w-24"
                    />
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      user.role === 'admin'
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                        : 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
