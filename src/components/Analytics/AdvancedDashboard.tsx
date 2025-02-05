import React, { useState, useEffect } from 'react';
import { Chart as ChartJS } from 'chart.js/auto';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  userGrowth: any;
  courseEngagement: any;
  skillDistribution: any;
  eventParticipation: any;
  userActivity: any;
}

export const AdvancedDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [
        userGrowthData,
        courseData,
        skillData,
        eventData,
        activityData
      ] = await Promise.all([
        fetchUserGrowth(),
        fetchCourseEngagement(),
        fetchSkillDistribution(),
        fetchEventParticipation(),
        fetchUserActivity()
      ]);

      setData({
        userGrowth: userGrowthData,
        courseEngagement: courseData,
        skillDistribution: skillData,
        eventParticipation: eventData,
        userActivity: activityData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const fetchUserGrowth = async () => {
    const { data } = await supabase
      .from('users')
      .select('created_at')
      .order('created_at', { ascending: true });

    // Process data for chart
    const groupedData = groupDataByTimeRange(data, timeRange);
    return {
      labels: groupedData.map(d => d.label),
      datasets: [{
        label: 'New Users',
        data: groupedData.map(d => d.count),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  };

  const fetchCourseEngagement = async () => {
    const { data } = await supabase
      .from('user_course_progress')
      .select('course_id, progress');

    // Process data for chart
    const courseProgress = data?.reduce((acc: any, curr) => {
      acc[curr.course_id] = (acc[curr.course_id] || 0) + curr.progress;
      return acc;
    }, {});

    return {
      labels: Object.keys(courseProgress),
      datasets: [{
        label: 'Course Engagement',
        data: Object.values(courseProgress),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }]
    };
  };

  const fetchSkillDistribution = async () => {
    const { data } = await supabase
      .from('user_skills')
      .select('skill_name, proficiency_level');

    // Process data for chart
    const skillDistribution = data?.reduce((acc: any, curr) => {
      acc[curr.skill_name] = (acc[curr.skill_name] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(skillDistribution),
      datasets: [{
        data: Object.values(skillDistribution),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
      }]
    };
  };

  const fetchEventParticipation = async () => {
    const { data } = await supabase
      .from('event_registrations')
      .select('event_id, status');

    // Process data for chart
    const eventParticipation = data?.reduce((acc: any, curr) => {
      acc[curr.event_id] = (acc[curr.event_id] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(eventParticipation),
      datasets: [{
        label: 'Event Participation',
        data: Object.values(eventParticipation),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      }]
    };
  };

  const fetchUserActivity = async () => {
    const { data } = await supabase
      .from('user_interactions')
      .select('interaction_type, created_at')
      .order('created_at', { ascending: true });

    // Process data for chart
    const groupedData = groupDataByTimeRange(data, timeRange);
    return {
      labels: groupedData.map(d => d.label),
      datasets: [{
        label: 'User Activity',
        data: groupedData.map(d => d.count),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }]
    };
  };

  const groupDataByTimeRange = (data: any[], range: string) => {
    // Implementation of data grouping based on time range
    // Returns formatted data for charts
    return [];
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end space-x-4">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          {data?.userGrowth && <Line data={data.userGrowth} />}
        </div>

        {/* Course Engagement */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Course Engagement</h3>
          {data?.courseEngagement && <Bar data={data.courseEngagement} />}
        </div>

        {/* Skill Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Skill Distribution</h3>
          {data?.skillDistribution && <Doughnut data={data.skillDistribution} />}
        </div>

        {/* Event Participation */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Event Participation</h3>
          {data?.eventParticipation && <Bar data={data.eventParticipation} />}
        </div>

        {/* User Activity Timeline */}
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">User Activity Timeline</h3>
          {data?.userActivity && <Line data={data.userActivity} />}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;
