import { getAPI, postAPI, putAPI, deleteAPI } from "../page/api/Api";

// Auth APIs
export const registerUser = (data) => postAPI("/auth/register", data);
export const loginUser = (data) => postAPI("/auth/login", data);
export const avaterUplodar = (data) => postAPI("/auth/avatar", data);
export const getProfile = () => getAPI("/auth/profile");
export const updateProfile = (data) => postAPI("/auth/profile", data);
export const searchUsers = (query) => getAPI(`/auth/search?query=${query}`);
export const addContact = (contactId) => postAPI("/auth/contact", { contactId });

// Chat APIs
export const accessChat = (userId) => postAPI("/chat/access", { userId });
export const getMyChats = () => getAPI("/chat");
export const getMessages = (chatId) => getAPI(`/chat/messages/${chatId}`);
export const updateMessageAPI = (messageId, data) => putAPI(`/chat/message/${messageId}`, data);
export const sendMessage = (data) => postAPI("/chat/message", data);
export const markSeen = (chatId) => putAPI(`/chat/seen/${chatId}`);
export const deleteMessageAPI = (messageId) => deleteAPI(`/chat/message/${messageId}`);
export const createGroup = (data) => postAPI("/chat/group", data);
export const updateGroupAPI = (data) => putAPI("/chat/group", data);
export const leaveGroupAPI = (data) => postAPI("/chat/leave", data);
export const getPublicChat = () => getAPI("/chat/public");
export const removeContactAPI = (contactId) => deleteAPI(`/chat/contact/${contactId}`);
export const blockUserAPI = (userId) => postAPI("/chat/block", { userId });
export const uploadMediaAPI = (data) => postAPI("/chat/upload", data);
export const reactToMessageAPI = (messageId, emoji) => postAPI(`/chat/react/${messageId}`, { emoji });