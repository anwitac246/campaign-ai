"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";
import { Send } from "lucide-react";
import Navbar from "../components/navbar";

interface FormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
}

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<string>("");
    const [errors, setErrors] = useState<FormErrors>({});

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateForm = (): FormErrors => {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = "Invalid email address";
        if (!formData.subject.trim()) newErrors.subject = "Subject is required";
        if (!formData.message.trim()) newErrors.message = "Message is required";
        return newErrors;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus("");

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setLoading(false);
            return;
        }

        // Simulate email sending (replace with actual EmailJS implementation)
        setTimeout(() => {
            setStatus("Message sent successfully! We'll get back to you soon.");
            setFormData({ name: "", email: "", subject: "", message: "" });
            setErrors({});
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
            <Navbar/>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 m-6">
                        Get In Touch
                    </h1>
                    <p className="text-lg text-gray-600">
                        Have a question or want to work together? Send us a message!
                    </p>
                </div>

                {/* Two Column Layout */}
                <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden max-w-6xl mx-auto">
                    {/* Left Side - Image Section */}
                    <div className="flex-1 relative overflow-hidden">
                        <img
                            src="/6594.jpg"
                            alt="Contact us"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Right Side - Contact Form */}
                    <div className="flex-1 p-8 lg:p-12">
                        {status && (
                            <div
                                className={`mb-6 p-4 rounded-lg text-sm ${
                                    status.includes("successfully")
                                        ? "bg-green-50 border border-green-300 text-green-700"
                                        : "bg-red-50 border border-red-300 text-red-700"
                                }`}
                            >
                                {status}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-900 mb-2"
                                >
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className={`w-full px-4 py-3 border ${
                                        errors.name ? "border-red-400" : "border-gray-300"
                                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 bg-white`}
                                />
                                {errors.name && (
                                    <p className="text-red-600 text-sm mt-2">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-900 mb-2"
                                >
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className={`w-full px-4 py-3 border ${
                                        errors.email ? "border-red-400" : "border-gray-300"
                                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 bg-white`}
                                />
                                {errors.email && (
                                    <p className="text-red-600 text-sm mt-2">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="subject"
                                    className="block text-sm font-medium text-gray-900 mb-2"
                                >
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="What is this about?"
                                    className={`w-full px-4 py-3 border ${
                                        errors.subject ? "border-red-400" : "border-gray-300"
                                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 bg-white`}
                                />
                                {errors.subject && (
                                    <p className="text-red-600 text-sm mt-2">{errors.subject}</p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="message"
                                    className="block text-sm font-medium text-gray-900 mb-2"
                                >
                                    Your Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Tell us more about your inquiry..."
                                    rows={5}
                                    className={`w-full px-4 py-3 border ${
                                        errors.message ? "border-red-400" : "border-gray-300"
                                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 bg-white resize-none`}
                                />
                                {errors.message && (
                                    <p className="text-red-600 text-sm mt-2">{errors.message}</p>
                                )}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-blue-800 text-white py-3 rounded-lg font-medium hover:bg-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    "Sending..."
                                ) : (
                                    <>
                                        Send Message
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                            <p className="text-gray-600 text-sm">
                                We typically respond within 24 hours
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;