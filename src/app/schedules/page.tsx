'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Upload, Check, X, AlertCircle, List, Trash2, Eye } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isFinalized?: boolean;
}

interface ScheduledPost {
  _id: string;
  sessionId: string;
  campaignTitle: string;
  scheduledAt: string;
  status: 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';
  videoUrl?: string;
  videoId?: string;
  errorMessage?: string;
  attempts: number;
  postedAt?: string;
  createdAt: string;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface SessionDetail {
  id: string;
  title: string;
  campaignStrategy?: any;
  campaignContent?: any;
  visualConcept?: any;
  isFinalized?: boolean;
}

const API_BASE_URL = 'http://localhost:3005';

const SchedulingPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'scheduled'>('schedule');

  useEffect(() => {
    loadSessions();
    loadScheduledPosts();
    
    // Refresh scheduled posts every 30 seconds
    const interval = setInterval(loadScheduledPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      const data = await response.json();
      
      // Filter only finalized sessions (those with complete campaign data)
      const completeSessions = data.sessions.filter((s: Session) => s.isFinalized);
      setSessions(completeSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      showMessage('error', 'Failed to load campaigns');
    }
  };

  const loadScheduledPosts = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduled-posts`);
      const data = await response.json();
      setScheduledPosts(data.scheduledPosts || []);
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    }
  };

  const handleSessionSelect = async (sessionId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
      const data = await response.json();
      setSelectedSession(data);
    } catch (error) {
      console.error('Error loading session details:', error);
      showMessage('error', 'Failed to load campaign details');
    }
  };

  const handleSchedule = async (): Promise<void> => {
    if (!selectedSession) {
      showMessage('error', 'Please select a campaign');
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      showMessage('error', 'Please select date and time');
      return;
    }

    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      
      if (scheduledDateTime <= new Date()) {
        showMessage('error', 'Scheduled time must be in the future');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/schedule-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          scheduledAt: scheduledDateTime.toISOString(),
          videoDuration: parseInt(String(videoDuration))
        })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `Campaign scheduled for ${scheduledDateTime.toLocaleString()}`);
        setSelectedSession(null);
        setScheduleDate('');
        setScheduleTime('');
        loadScheduledPosts();
        setActiveTab('scheduled');
      } else {
        showMessage('error', data.error || 'Failed to schedule post');
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
      showMessage('error', 'Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async (scheduleId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to cancel this scheduled post?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduled-posts/${scheduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('success', 'Scheduled post cancelled');
        loadScheduledPosts();
      } else {
        showMessage('error', 'Failed to cancel scheduled post');
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      showMessage('error', 'Failed to cancel scheduled post');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string): void => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'posting': return 'bg-yellow-100 text-yellow-800';
      case 'posted': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Scheduler</h1>
          <p className="text-gray-600">Schedule your finalized campaigns to post automatically to YouTube</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Schedule New
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'scheduled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <List className="w-4 h-4 inline mr-2" />
                Scheduled Posts ({scheduledPosts.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'schedule' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Select Campaign</h2>
              
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No finalized campaigns available</p>
                  <p className="text-sm mt-2">Complete and finalize a campaign first</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSessionSelect(session.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedSession?.id === session.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{session.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Created: {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Schedule Details</h2>
              
              {!selectedSession ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a campaign to schedule</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Selected Campaign</h3>
                    <p className="text-sm text-gray-600">{selectedSession.title}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Date
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Time
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(Number(e.target.value))}
                      min="1"
                      max="60"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {scheduleDate && scheduleTime && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Will post on:</strong><br />
                        {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSchedule}
                    disabled={loading || !scheduleDate || !scheduleTime}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5" />
                        Schedule Post
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {scheduledPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No scheduled posts</p>
                <p className="text-sm mt-2">Schedule your first campaign to see it here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled For</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video URL</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scheduledPosts.map((post) => (
                      <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{post.campaignTitle}</div>
                          <div className="text-xs text-gray-500">ID: {post.sessionId.slice(0, 12)}...</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(post.scheduledAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                            {post.status.toUpperCase()}
                          </span>
                          {post.errorMessage && (
                            <div className="text-xs text-red-600 mt-1">{post.errorMessage.substring(0, 50)}...</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {post.videoUrl ? (
                            <a
                              href={post.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {post.status === 'scheduled' && (
                            <button
                              onClick={() => handleCancelSchedule(post._id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Cancel scheduled post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulingPage;