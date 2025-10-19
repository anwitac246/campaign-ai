'use client'
import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Upload,
  File,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  MessageSquare,
  Trash2,
  Menu,
  Copy,
  Check,
  Paperclip,
  Search,
  Settings,
  Edit,
  BookOpen,
  Compass,
  Download,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: Date;
  agentType?: string;
  file?: {
    name: string;
    type: string;
    size: number;
  };
  imageData?: {
    path: string;
    mimeType: string;
  };
  isEdited?: boolean;
  requiresFeedback?: boolean;
  feedbackStep?: string;
  feedbackReceived?: boolean;
  data?: {
    strategy?: any;
    research?: any;
    copy?: any;
    visualConcept?: any;
    mediaPlan?: any;
    imagePath?: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const GlowingEffect = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseenter', () => setIsHovering(true));
      element.addEventListener('mouseleave', () => setIsHovering(false));
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseenter', () => setIsHovering(true));
        element.removeEventListener('mouseleave', () => setIsHovering(false));
      }
    };
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {isHovering && (
        <div
          className="pointer-events-none absolute z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-xl"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            background: 'radial-gradient(circle, rgba(139, 69, 255, 0.6) 0%, rgba(99, 102, 241, 0.3) 50%, transparent 70%)'
          }}
        />
      )}
      {children}
    </div>
  );
};

const FeedbackPanel = ({ 
  messageId, 
  feedbackStep, 
  onApprove, 
  onReject,
  isProcessing 
}: { 
  messageId: string;
  feedbackStep: string;
  onApprove: () => void;
  onReject: (feedback: string) => void;
  isProcessing: boolean;
}) => {
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleReject = () => {
    if (feedbackText.trim()) {
      onReject(feedbackText);
      setFeedbackText('');
      setShowFeedbackInput(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg border border-violet-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">
          {feedbackStep === 'strategy' && 'Review the campaign strategy'}
          {feedbackStep === 'copy' && 'Review the marketing copy'}
          {feedbackStep === 'image' && 'Review the visual concept'}
        </p>
      </div>

      {!showFeedbackInput ? (
        <div className="flex items-center space-x-3">
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Accept & Continue</span>
          </button>
          <button
            onClick={() => setShowFeedbackInput(true)}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="h-4 w-4" />
            <span className="font-medium">Suggest Changes</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Describe the changes you'd like to make..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            rows={3}
            disabled={isProcessing}
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReject}
              disabled={!feedbackText.trim() || isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              <span className="font-medium">Submit Feedback</span>
            </button>
            <button
              onClick={() => {
                setShowFeedbackInput(false);
                setFeedbackText('');
              }}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Processing your feedback...</span>
        </div>
      )}
    </div>
  );
};

const ImageDownloadButton = ({ imagePath }: { imagePath: string }) => {
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`http://localhost:3005/${imagePath}`);
      const blob = await response.blob();
      
      let finalBlob = blob;
      let fileName = imagePath.split('/').pop() || 'image';

      if (downloadFormat === 'jpeg' && blob.type === 'image/png') {
        finalBlob = await convertToJpeg(blob);
        fileName = fileName.replace('.png', '.jpeg');
      } else if (downloadFormat === 'pdf') {
        finalBlob = await convertToPdf(blob);
        fileName = fileName.replace(/\.(png|jpeg|jpg)$/, '.pdf');
      } else if (downloadFormat === 'png' && !fileName.endsWith('.png')) {
        fileName = fileName.replace(/\.(jpeg|jpg)$/, '.png');
      }

      const url = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const convertToJpeg = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((newBlob) => {
          resolve(newBlob!);
        }, 'image/jpeg', 0.95);
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  const convertToPdf = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const imgData = canvas.toDataURL('image/jpeg');
        const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 ${canvas.width} ${canvas.height}]/Parent 2 0 R/Resources<</XObject<</I0 4 0 R>>>>>>endobj
4 0 obj<</Type/XObject/Subtype/Image/Width ${canvas.width}/Height ${canvas.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${imgData.length}>>stream
${imgData}
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000200 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
${300 + imgData.length}
%%EOF`;
        
        const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
        resolve(pdfBlob);
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center space-x-2 bg-violet-50 rounded-lg p-2">
        <select
          value={downloadFormat}
          onChange={(e) => setDownloadFormat(e.target.value as 'png' | 'jpeg' | 'pdf')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="pdf">PDF</option>
        </select>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center space-x-2 px-4 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isDownloading ? 'Downloading...' : 'Download'}
          </span>
        </button>
      </div>
    </div>
  );
};

const SchedulePostModal = ({ 
  sessionId, 
  onClose, 
  onScheduled 
}: { 
  sessionId: string;
  onClose: () => void;
  onScheduled: () => void;
}) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      setScheduleResult({ success: false, error: 'Please select both date and time' });
      return;
    }

    setIsScheduling(true);
    setScheduleResult(null);

    try {
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      const response = await fetch('http://localhost:3005/api/campaign/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, scheduledFor })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule post');
      }

      setScheduleResult({
        success: true,
        message: data.message
      });

      setTimeout(() => {
        onScheduled();
        onClose();
      }, 2000);

    } catch (error: any) {
      setScheduleResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-violet-600" />
            Schedule YouTube Post
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {scheduleResult && (
            <div className={`p-4 rounded-lg ${scheduleResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm font-medium ${scheduleResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {scheduleResult.success ? '✅ ' + scheduleResult.message : '❌ ' + scheduleResult.error}
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSchedule}
              disabled={isScheduling || !scheduledDate || !scheduledTime}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Calendar className="h-5 w-5" />
              <span>{isScheduling ? 'Scheduling...' : 'Schedule Post'}</span>
            </button>
            <button
              onClick={onClose}
              disabled={isScheduling}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StrategyToggle = ({ strategy }: { strategy: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!strategy) return null;

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">View Campaign Strategy</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
      </button>
      
      {isOpen && (
        <div className="p-4 space-y-3 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Core Message:</span>
            <p className="text-gray-600 mt-1">{strategy.coreMessage}</p>
          </div>
          
          <div>
            <span className="font-semibold text-gray-700">Tone:</span>
            <p className="text-gray-600 mt-1">{strategy.tone}</p>
          </div>
          
          {strategy.targetAudience && (
            <div>
              <span className="font-semibold text-gray-700">Target Audience:</span>
              <p className="text-gray-600 mt-1">{strategy.targetAudience.primary}</p>
              {strategy.targetAudience.demographics && (
                <p className="text-gray-600 text-xs mt-1">Demographics: {strategy.targetAudience.demographics}</p>
              )}
            </div>
          )}
          
          {strategy.targetChannels && strategy.targetChannels.length > 0 && (
            <div>
              <span className="font-semibold text-gray-700">Target Channels:</span>
              <p className="text-gray-600 mt-1">{strategy.targetChannels.join(', ')}</p>
            </div>
          )}
          
          {strategy.keyMessagingPillars && strategy.keyMessagingPillars.length > 0 && (
            <div>
              <span className="font-semibold text-gray-700">Key Messaging Pillars:</span>
              <ul className="text-gray-600 mt-1 space-y-1">
                {strategy.keyMessagingPillars.map((pillar: string, index: number) => (
                  <li key={index} className="ml-4">• {pillar}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MediaPlanDisplay = ({ mediaPlan }: { mediaPlan: any }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!mediaPlan) return null;

  return (
    <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900">Media Plan & Content Calendar</span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
      </button>
      
      {isOpen && (
        <div className="p-4 space-y-4">
          {mediaPlan.channelStrategy && mediaPlan.channelStrategy.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                Channel Strategy
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Channel</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Role</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Focus</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Content Mix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mediaPlan.channelStrategy.map((channel: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{channel.channel}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            channel.role === 'Primary' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {channel.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{channel.focus}</td>
                        <td className="px-3 py-2 text-gray-600">{channel.contentMix}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mediaPlan.postingSchedule && mediaPlan.postingSchedule.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Weekly Posting Schedule
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Day</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Time</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Platform</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Content Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mediaPlan.postingSchedule.map((post: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{post.day}</td>
                        <td className="px-3 py-2 text-gray-600">{post.time}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                            {post.platform}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{post.contentType}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{post.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mediaPlan.recommendedContentTypes && mediaPlan.recommendedContentTypes.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Recommended Content Types</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mediaPlan.recommendedContentTypes.map((content: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{content.type}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        content.priority === 'High' ? 'bg-red-100 text-red-700' :
                        content.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {content.priority}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Frequency: <span className="font-medium">{content.frequency}</span>
                    </div>
                    <div className="text-xs text-gray-500">{content.rationale}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaPlan.collaborationIdeas && mediaPlan.collaborationIdeas.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Collaboration Opportunities</h4>
              <div className="space-y-3">
                {mediaPlan.collaborationIdeas.map((collab: any, index: number) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="font-medium text-gray-900 mb-1">{collab.type}</div>
                    <div className="text-sm text-gray-700 mb-1">{collab.suggestion}</div>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>Impact: {collab.expectedImpact}</span>
                      <span>Implementation: {collab.implementation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaPlan.contentCalendar && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Content Calendar Overview</h4>
              <div className="space-y-3">
                {mediaPlan.contentCalendar.themes && mediaPlan.contentCalendar.themes.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Weekly Themes:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mediaPlan.contentCalendar.themes.map((theme: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {mediaPlan.contentCalendar.campaigns && mediaPlan.contentCalendar.campaigns.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Mini Campaigns:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mediaPlan.contentCalendar.campaigns.map((campaign: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {campaign}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {mediaPlan.contentCalendar.events && mediaPlan.contentCalendar.events.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Key Events:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mediaPlan.contentCalendar.events.map((event: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {mediaPlan.budgetAllocation && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Budget Allocation</h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-gray-600">Organic Content</div>
                  <div className="text-2xl font-bold text-green-700">{mediaPlan.budgetAllocation.organic}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-gray-600">Paid Advertising</div>
                  <div className="text-2xl font-bold text-blue-700">{mediaPlan.budgetAllocation.paid}</div>
                </div>
              </div>
              {mediaPlan.budgetAllocation.recommendations && (
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Recommendations: </span>
                  {mediaPlan.budgetAllocation.recommendations}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CampaignActionButtons = ({ 
  sessionId, 
  onDownload, 
  onPost 
}: { 
  sessionId: string;
  onDownload: () => void;
  onPost: () => void;
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [postResult, setPostResult] = useState<{ success: boolean; videoUrl?: string; error?: string; details?: string; hint?: string } | null>(null);

  useEffect(() => {
    loadScheduledPosts();
  }, [sessionId]);

  const loadScheduledPosts = async () => {
    try {
      const response = await fetch(`http://localhost:3005/api/campaign/scheduled/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setScheduledPosts(data.scheduledPosts || []);
      }
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    }
  };

  const cancelScheduledPost = async (scheduledPostId: string) => {
    try {
      const response = await fetch(`http://localhost:3005/api/campaign/scheduled/${scheduledPostId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadScheduledPosts();
      }
    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('http://localhost:3005/api/campaign/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign-${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onDownload();
    } catch (error: any) {
      console.error('Download error:', error);
      alert(`Failed to download campaign PDF: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePost = async () => {
    setIsPosting(true);
    setPostResult(null);
    
    try {
      const response = await fetch('http://localhost:3005/api/campaign/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Post failed');
      }

      setPostResult({
        success: true,
        videoUrl: data.videoUrl
      });
      
      onPost();
    } catch (error: any) {
      setPostResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
        Campaign Complete - Ready to Launch
      </h4>
      
      <div className="flex items-center space-x-3 flex-wrap gap-2">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Download className="h-5 w-5" />
          <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
        </button>

        <button
          onClick={handlePost}
          disabled={isPosting}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Upload className="h-5 w-5" />
          <span>{isPosting ? 'Posting...' : 'Post Now'}</span>
        </button>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium"
        >
          <Calendar className="h-5 w-5" />
          <span>Schedule Post</span>
        </button>
      </div>

      {scheduledPosts.filter(p => p.status === 'pending').length > 0 && (
        <div className="mt-4 p-3 bg-violet-50 rounded-lg border border-violet-200">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Scheduled Posts:</h5>
          <div className="space-y-2">
            {scheduledPosts.filter(p => p.status === 'pending').map(post => (
              <div key={post.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-violet-600" />
                  <span className="text-gray-700">
                    {new Date(post.scheduledFor).toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                    {post.status}
                  </span>
                </div>
                <button
                  onClick={() => cancelScheduledPost(post.id)}
                  className="text-red-600 hover:text-red-700 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {postResult && (
        <div className={`mt-3 p-4 rounded-lg border-2 ${postResult.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          {postResult.success ? (
            <div>
              <p className="text-green-800 font-medium mb-2">✅ Successfully posted to YouTube!</p>
              <a 
                href={postResult.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                View video on YouTube →
              </a>
            </div>
          ) : (
            <div>
              <p className="text-red-800 font-bold mb-2">❌ {postResult.error}</p>
            </div>
          )}
        </div>
      )}
      
      {showScheduleModal && (
        <SchedulePostModal
          sessionId={sessionId}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={loadScheduledPosts}
        />
      )}
    </div>
  );
};

const MarketResearchDisplay = ({ research }: { research: any }) => {
  if (!research || !research.localInfluencers || research.localInfluencers.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="border border-gray-200 rounded-lg bg-white p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Local Influencers</h4>
        <div className="space-y-3">
          {research.localInfluencers.map((influencer: any, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{influencer.name}</div>
                  <div className="text-sm text-gray-600">{influencer.username}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Followers: {influencer.followers?.toLocaleString() || 'N/A'}
                    {influencer.engagementRate && ` • Engagement: ${influencer.engagementRate}`}
                  </div>
                  <div className="text-sm text-gray-700 mt-2">{influencer.reason}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {research.outreachMessages && research.outreachMessages.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-white p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Outreach Messages</h4>
          <div className="space-y-3">
            {research.outreachMessages.map((outreach: any, index: number) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-gray-900 text-sm mb-1">To: {outreach.influencer}</div>
                {outreach.subject && (
                  <div className="text-sm text-gray-700 mb-2">Subject: {outreach.subject}</div>
                )}
                <div className="text-sm text-gray-600 whitespace-pre-wrap">{outreach.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {research.trendingHashtags && research.trendingHashtags.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-white p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Trending Hashtags</h4>
          <div className="flex flex-wrap gap-2">
            {research.trendingHashtags.map((tag: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatMarkdown = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let codeBlockId = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      
      parts.push({
        type: 'codeblock',
        language: match[1] || 'text',
        content: match[2]?.trim() || '',
        id: `code-${codeBlockId++}`
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'codeblock') {
        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-600">
                {part.language}
              </span>
              <button
                onClick={() => copyToClipboard(part.content || '', part.id || '')}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs hover:bg-gray-200 text-gray-600"
              >
                {copiedCode === part.id ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-gray-800">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      } else {
        return (
          <div 
            key={index} 
            dangerouslySetInnerHTML={{ 
              __html: formatTextMarkdown(part.content || '') 
            }}
          />
        );
      }
    });
  };

  const formatTextMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-900">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2 text-gray-900">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-700">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded text-sm bg-gray-100 text-gray-800 font-mono">$1</code>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4 text-gray-800">• $1</li>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-800">• $1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-violet-600 hover:text-violet-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="prose prose-sm max-w-none">
      {formatMarkdown(content)}
    </div>
  );
};

export default function Chatbot() {
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [processingFeedback, setProcessingFeedback] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const loadUserSessions = async (userId: string) => {
    setSessionsLoading(true);
    try {
      const response = await fetch(`http://localhost:3005/api/sessions?userId=${userId}&limit=50`);
      if (!response.ok) throw new Error('Failed to load sessions');
      
      const data = await response.json();
      const sessions: ChatSession[] = data.sessions.map((s: any) => ({
        id: s.id,
        title: s.title,
        messages: [],
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt)
      }));
      
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load chat history');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const loadChat = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:3005/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load session');
      
      const data = await response.json();
      
      const loadedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        agentType: msg.agentType,
        file: msg.file,
        imageData: msg.imageData,
        isEdited: msg.isEdited,
        requiresFeedback: msg.requiresFeedback,
        feedbackStep: msg.feedbackStep,
        feedbackReceived: msg.feedbackReceived,
        data: {
          strategy: data.campaignStrategy,
          research: data.marketResearch,
          copy: data.campaignContent,
          visualConcept: data.visualConcept,
          mediaPlan: data.mediaPlan
        }
      }));
      
      setMessages(loadedMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading chat:', error);
      setError('Failed to load conversation');
    }
  };

  const deleteChat = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:3005/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete session');
      
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete conversation');
    }
  };

  const updateChatSession = (messages: Message[]) => {
    if (!currentSessionId) return;
    
    setChatSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? {
            ...session,
            messages,
            title: (messages[0]?.content || '').substring(0, 50) || 'New chat',
            updatedAt: new Date()
          }
        : session
    ));
  };

  const handleFeedback = async (messageId: string, feedbackStep: string, approved: boolean, feedback?: string) => {
    if (!currentSessionId) return;

    setProcessingFeedback(true);
    
    try {
      const response = await fetch('http://localhost:3005/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          feedbackStep,
          approved,
          feedback: feedback || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process feedback');
      }

      const data = await response.json();

      const updatedMessages = messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedbackReceived: true, requiresFeedback: false }
          : msg
      );

      const botMessage: Message = {
        id: Date.now().toString(),
        type: data.agentType === 'general' ? 'bot' : 'agent',
        content: data.response,
        timestamp: new Date(),
        agentType: data.agentType,
        requiresFeedback: data.requiresFeedback || false,
        feedbackStep: data.feedbackStep || null,
        feedbackReceived: false,
        ...(data.imagePath && {
          imageData: {
            path: data.imagePath,
            mimeType: 'image/png'
          }
        }),
        ...(data.data && { data: data.data })
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      updateChatSession(finalMessages);

    } catch (error) {
      console.error('Error processing feedback:', error);
      setError('Failed to process feedback. Please try again.');
    } finally {
      setProcessingFeedback(false);
    }
  };

  const startEditingMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEditedMessage = async (messageId: string) => {
    if (!editingContent.trim() || !currentSessionId) return;

    try {
      const response = await fetch(`http://localhost:3005/api/messages/${messageId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          newContent: editingContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const updatedMessages = messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: editingContent, isEdited: true }
          : msg
      );
      
      setMessages(updatedMessages);
      updateChatSession(updatedMessages);
      setEditingMessageId(null);
      setEditingContent('');

      await sendMessage(`Edit the previous response: ${editingContent}`);

    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];

      if (allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError('Invalid file type or file too large (max 10MB)');
      }
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (synthRef.current && !isSpeaking) {
      synthRef.current.cancel();
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'code block')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s+(.*)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<[^>]*>/g, '')
        .replace(/&[^;]+;/g, '');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || inputText;
    
    if (!messageToSend.trim() && !uploadedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend || (uploadedFile ? `Uploaded file: ${uploadedFile.name}` : ''),
      timestamp: new Date(),
      ...(uploadedFile && {
        file: {
          name: uploadedFile.name,
          type: uploadedFile.type,
          size: uploadedFile.size
        }
      })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setUploadedFile(null);
    setIsTyping(true);
    setError(null);

    if (!currentSessionId) {
      const newSessionId = Date.now().toString();
      setCurrentSessionId(newSessionId);
      const newSession: ChatSession = {
        id: newSessionId,
        title: (userMessage.content || '').substring(0, 50) || 'New chat',
        messages: newMessages,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setChatSessions(prev => [newSession, ...prev]);
    }

    try {
      const formData = new FormData();
      formData.append('message', userMessage.content);
      formData.append('sessionId', currentSessionId || Date.now().toString());
      
      if (user) {
        formData.append('userId', user.uid);
      }
      
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      if (messages.length > 0) {
        const context = messages.slice(-5).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
        formData.append('context', JSON.stringify(context));
      }

      const response = await fetch('http://localhost:3005/api/chat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: data.agentType === 'general' ? 'bot' : 'agent',
        content: data.response,
        timestamp: new Date(),
        agentType: data.agentType,
        requiresFeedback: data.requiresFeedback || false,
        feedbackStep: data.feedbackStep || null,
        feedbackReceived: false,
        ...(data.imagePath && {
          imageData: {
            path: data.imagePath,
            mimeType: 'image/png'
          }
        }),
        ...(data.data && { data: data.data })
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      updateChatSession(updatedMessages);
      
      if (user) {
        loadUserSessions(user.uid);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please make sure the backend server is running on port 3005.',
        timestamp: new Date()
      };
      
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      updateChatSession(updatedMessages);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FFFAE2]">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-white hover:text-gray-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className={`${showSidebar ? 'w-64' : 'w-16'} transition-all duration-300 bg-[#FFFAE2] border-r border-gray-200 flex flex-col fixed left-0 top-0 bottom-0 z-10`}>
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-[#F2C34F] transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            {showSidebar && (
              <button className="p-2 rounded-lg hover:bg-[#F2C34F] transition-colors">
                <Search className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={createNewChat}
            className={`${showSidebar ? 'w-full justify-start px-3 py-2' : 'w-8 h-8 justify-center p-0'} flex items-center space-x-2 rounded-lg hover:bg-[#F2C34F] transition-colors text-gray-700`}
          >
            <Edit className="h-4 w-4 flex-shrink-0" />
            {showSidebar && <span className="text-sm font-medium">New chat</span>}
          </button>
        </div>

        {showSidebar && (
          <>
            <div className="px-4 pb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Gems</h3>
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#F2C34F] transition-colors text-left">
                  <BookOpen className="h-4 w-4 text-teal-600" />
                  <span className="text-sm text-gray-700">Campaign Creator</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#F2C34F] transition-colors text-left">
                  <Compass className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Explore Gems</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent</h3>
              <div className="space-y-1">
                {sessionsLoading ? (
                  <div className="py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Loading chats...</p>
                  </div>
                ) : chatSessions.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4">No recent conversations</p>
                ) : (
                  chatSessions.map((session) => (
                    <div key={session.id} className="group relative">
                      <button
                        onClick={() => loadChat(session.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          currentSessionId === session.id
                            ? 'bg-gray-100'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm text-gray-900 truncate">
                          {session.title}
                        </div>
                      </button>
                      <button
                        onClick={() => deleteChat(session.id)}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 border-t border-gray-200">
              <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left">
                <Settings className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Settings and help</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className={`flex-1 flex flex-col ${showSidebar ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <div className="flex-1 overflow-y-auto p-6 pb-32">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Relatus.AI
              </h1>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
                Your intelligent marketing campaign assistant. Generate strategies, copy, and visuals in seconds.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[{
                  bg: '#9ECAD6',
                  iconBg: '#9ECAD6',
                  icon: <MessageSquare className="h-6 w-6" />,
                  title: 'Create Campaigns',
                  desc: 'Generate complete campaign packages with strategy, copy, and visuals'
                },
                {
                  bg: '#F5CBCB',
                  iconBg: '#F5CBCB',
                  icon: <Upload className="h-6 w-6 " />,
                  title: 'Upload Briefs',
                  desc: 'Analyze documents and generate targeted marketing content'
                },
                {
                  bg: '#F2C34F',
                  iconBg: '#F2C34F',
                  icon: <ImageIcon className="h-6 w-6 " />,
                  title: 'Visual Generation',
                  desc: 'Create stunning visuals with AI-powered image generation'
                }].map((card, i) => (
                  <GlowingEffect key={i} className="h-full">
                    <div
                      className="relative rounded-3xl p-8 overflow-hidden flex flex-col items-center justify-start text-center"
                      style={{
                        background: card.bg,
                        borderTop: '2px solid black',
                        borderLeft: '2px solid black',
                        borderRight: '6px solid black',
                        borderBottom: '6px solid black',
                        height: '100%',       
                        minHeight: '200px',  
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                        style={{ background: card.iconBg }}
                      >
                        {card.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{card.title}</h4>
                      <p className="text-sm text-gray-600">{card.desc}</p>
                    </div>
                  </GlowingEffect>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
              <GlowingEffect>
                <div className={`max-w-xs lg:max-w-3xl px-3 py-2 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-[#76BDC3] text-white'
                    : ' text-gray-900 border border-gray-200 shadow-sm'
                }`}>
                  <div className="flex items-start space-x-3 ">
                    <div className="flex-1 ">
                      {message.file && (
                        <div className={`mb-3 p-3 rounded-lg ${
                          message.type === 'user' ? 'bg-violet-500/50' : 'bg-gray-50'
                        } flex items-center space-x-2`}>
                          {message.file.type.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <File className="h-4 w-4" />
                          )}
                          <span className="text-sm truncate">{message.file.name}</span>
                        </div>
                      )}
                      
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveEditedMessage(message.id)}
                              className="flex items-center space-x-1 px-3 py-1  text-white rounded-lg hover:bg-violet-700 text-sm"
                            >
                              <Save className="h-3 w-3" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex items-center space-x-1 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <MarkdownRenderer content={message.content} />
                          
                          {message.data?.strategy && (
                            <StrategyToggle strategy={message.data.strategy} />
                          )}
                          
                          {message.data?.research && (
                            <MarketResearchDisplay research={message.data.research} />
                          )}
                          
                          {message.data?.mediaPlan && (
                            <MediaPlanDisplay mediaPlan={message.data.mediaPlan} />
                          )}
                          {message.agentType === 'full_campaign' && !message.requiresFeedback && currentSessionId && (
                              <CampaignActionButtons
                                sessionId={currentSessionId}
                                onDownload={() => console.log('Downloaded')}
                                onPost={() => console.log('Posted to YouTube')}
                              />
                            )}
                          {message.imageData && (
                            <div className="mt-4 space-y-3">
                              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-md">
                                <img
                                  src={`http://localhost:3005/${message.imageData.path.replace(/\\/g, '/')}`}
                                  alt="Generated campaign visual"
                                  className="w-full h-auto"
                                  onError={(e) => {
                                    console.error('Image failed to load:', message.imageData?.path);
                                    console.log('Attempted URL:', `http://localhost:3005/${message.imageData?.path}`);
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%236b7280" font-size="16"%3EImage not available%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              </div>
                              <ImageDownloadButton imagePath={message.imageData.path} />
                            </div>
                          )}
                          
                          {message.requiresFeedback && !message.feedbackReceived && message.feedbackStep && (
                            <FeedbackPanel
                              messageId={message.id}
                              feedbackStep={message.feedbackStep}
                              onApprove={() => handleFeedback(message.id, message.feedbackStep!, true)}
                              onReject={(feedback) => handleFeedback(message.id, message.feedbackStep!, false, feedback)}
                              isProcessing={processingFeedback}
                            />
                          )}
                        </>
                      )}
                      
                      {(message.type === 'bot' || message.type === 'agent') && editingMessageId !== message.id && !message.requiresFeedback && (
                        <div className="flex items-center space-x-2 mt-3 bg-white">
                          <button
                            onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                            className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
                          >
                            {isSpeaking ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditingMessage(message.id, message.content)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {message.agentType && (
                            <span className="text-xs px-2 py-1  rounded-full font-medium">
                              {message.agentType === 'full_campaign' ? 'Full Campaign' : 
                               message.agentType === 'strategy' ? 'Strategy' :
                               message.agentType === 'copywriting' ? 'Copy' :
                               message.agentType === 'image' ? 'Visual' : 
                               message.agentType === 'edit' ? 'Edited' : message.agentType}
                            </span>
                          )}
                          {message.isEdited && (
                            <span className="text-xs text-gray-500">Edited</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlowingEffect>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start mb-6">
              <GlowingEffect>
                <div className="px-5 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce bg-violet-400" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500">Generating campaign...</span>
                </div>
              </GlowingEffect>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className={`fixed bottom-0 right-0 ${showSidebar ? 'left-64' : 'left-16'} transition-all duration-300 p-6 border-t border-gray-200 bg-[#FFFAE2] z-10`}>
          {uploadedFile && (
            <GlowingEffect>
              <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {uploadedFile.type.startsWith('image/') ? (
                    <ImageIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <File className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{uploadedFile.name}</span>
                </div>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </GlowingEffect>
          )}

          <div className="flex items-center space-x-3">
            <GlowingEffect>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-[#F5CBCB]  flex items-center justify-center  hover:border-2 border-black"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </GlowingEffect>

            <GlowingEffect>
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-xl flex items-center justify-center hover:border-2 border-black ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 '
                    : 'bg-[#F5CBCB] hover:bg-[#F5CBCB]/90 '
                }`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </GlowingEffect>

            <GlowingEffect className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Describe your campaign or marketing brief..."
                className={`w-full px-5 py-2 rounded-2xl border border-gray-300 text-black placeholder-gray-500
                  hover:border-black focus:border-black focus:ring-0`}
                rows={1}
              />
            </GlowingEffect>

            <GlowingEffect>
              <button
                onClick={() => sendMessage()}
                disabled={!inputText.trim() && !uploadedFile}
                className={`p-3 rounded-xl flex items-center justify-center  hover:border-2 border-black ${
                  inputText.trim() || uploadedFile
                    ? 'bg-[#9ECAD6] hover:bg-[#9ECAD6]/90 shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </GlowingEffect>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,image/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}