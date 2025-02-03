import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LiveChat from '../RealTime/LiveChat';

interface Session {
  id: string;
  title: string;
  speaker: {
    name: string;
    bio: string;
    avatar: string;
  };
  startTime: string;
  endTime: string;
  description: string;
  streamUrl: string;
}

interface VirtualConferenceProps {
  conferenceId: string;
  currentUser: any;
}

export const VirtualConference: React.FC<VirtualConferenceProps> = ({
  conferenceId,
  currentUser,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<number>(0);

  useEffect(() => {
    loadConferenceData();
    subscribeToParticipants();
  }, [conferenceId]);

  const loadConferenceData = async () => {
    const { data: sessionsData, error } = await supabase
      .from('conference_sessions')
      .select('*')
      .eq('conference_id', conferenceId)
      .order('startTime', { ascending: true });

    if (error) {
      console.error('Error loading conference data:', error);
      return;
    }

    setSessions(sessionsData);
    
    // Set current session based on time
    const now = new Date();
    const currentSessionData = sessionsData.find(
      session =>
        new Date(session.startTime) <= now && new Date(session.endTime) >= now
    );
    
    setCurrentSession(currentSessionData || null);
  };

  const subscribeToParticipants = () => {
    const subscription = supabase
      .channel(`conference:${conferenceId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = subscription.presenceState();
        setParticipants(Object.keys(presenceState).length);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Conference Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Virtual Conference
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {participants} participants online
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Session */}
            {currentSession ? (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={currentSession.streamUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-bold">{currentSession.title}</h2>
                  <div className="mt-2 flex items-center">
                    <img
                      src={currentSession.speaker.avatar}
                      alt={currentSession.speaker.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="ml-3">
                      <p className="font-medium">{currentSession.speaker.name}</p>
                      <p className="text-sm text-gray-500">
                        {currentSession.speaker.bio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-500">No session currently running</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Schedule</h3>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg ${
                      currentSession?.id === session.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <p className="font-medium">{session.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.startTime).toLocaleTimeString()} -{' '}
                      {new Date(session.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Chat */}
            <LiveChat
              channelId={`conference:${conferenceId}`}
              currentUser={currentUser}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default VirtualConference;
