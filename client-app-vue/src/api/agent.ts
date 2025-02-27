import axios, { AxiosError, AxiosResponse } from "axios";
// import { toast } from "react-toastify";
import { Activity, ActivityFormValues } from "../models/activity";
import { User, UserFormValues } from "../models/user";
import { Photo, Profile, UserActivity } from "../models/profile";
import { PaginatedResult } from "../models/pagination";
import { useUserStore } from "../stores/userStore";
import {
  AdminPermissions,
  ChannelDetailsDto,
  ChatDto,
  GroupDetailsDto,
  GroupMember,
  GroupMemberPermissions,
  Message,
  Pin,
  PrivateChat,
  SearchResult,
} from "../models/chat";

axios.defaults.baseURL = "http://localhost:5000/api/";

const sleep = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

const responseBody = <T>(response: AxiosResponse<T>) => response.data;

axios.interceptors.request.use((config) => {
  const userStore = useUserStore();
  const token = userStore.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  async (response) => {
    await sleep(1000);
    const pagination = response.headers["pagination"];
    if (pagination) {
      response.data = new PaginatedResult(
        response.data,
        JSON.parse(pagination)
      );
      return response as AxiosResponse<PaginatedResult<any>>;
    }
    return response;
  },
  (error: AxiosError) => {
    const userStore = useUserStore();
    const { data, status, config } = error.response!;
    switch (status) {
      case 400:
        if (typeof data === "string") {
          //   toast.error(data);
        }
        if (config.method === "get" && data.errors.hasOwnProperty("id")) {
          userStore.router.push({ path: "/not-found", replace: true });
        }
        if (data.errors) {
          const modalStateErrors = [];
          for (const key in data.errors) {
            if (data.errors[key]) {
              modalStateErrors.push(data.errors[key]);
            }
          }
          throw modalStateErrors.flat();
        }
        break;
      case 401:
        // toast.error("unauthorized");
        break;
      case 404:
        userStore.router.push({ path: "/not-found", replace: true });
        break;
      case 500:
        userStore.router.push({ path: "/server-error", replace: true });
        break;
    }
    return Promise.reject(error);
  }
);

const requests = {
  get: <T>(url: string) => axios.get<T>(url).then(responseBody),
  post: <T>(url: string, body: {}) =>
    axios.post<T>(url, body).then(responseBody),
  put: <T>(url: string, body: {}) => axios.put<T>(url, body).then(responseBody),
  del: <T>(url: string) => axios.delete<T>(url).then(responseBody),
};

const Activities = {
  list: (params: URLSearchParams) =>
    axios
      .get<PaginatedResult<Activity[]>>("/activities", { params })
      .then(responseBody),
  details: (id: string) => requests.get<Activity>(`/activities/${id}`),
  create: (activity: ActivityFormValues) =>
    requests.post<void>("/activities", activity),
  update: (activity: ActivityFormValues) =>
    requests.put<void>(`/activities/${activity.id}`, activity),
  delete: (id: string) => requests.del<void>(`activities/${id}`),
  attend: (id: string) => requests.post<void>(`/activities/${id}/attend`, {}),
};

const Account = {
  current: () => requests.get<User>("/account"),
  login: (user: UserFormValues) => requests.post<User>("/account/login", user),
  register: (user: UserFormValues) =>
    requests.post<User>("/account/register", user),
};

const Profiles = {
  get: (username: string) => requests.get<Profile>(`/profiles/${username}`),
  uploadPhoto: (file: Blob) => {
    let formData = new FormData();
    formData.append("File", file);
    return axios.post<Photo>("photos", formData, {
      headers: { "Content-type": "multipart/form-data" },
    });
  },
  setMainPhoto: (id: string) => requests.post(`/photos/${id}/setMain`, {}),
  deletePhoto: (id: string) => requests.del(`/photos/${id}`),
  updateFollowing: (username: string) =>
    requests.post(`/follow/${username}`, {}),
  listFollowings: (username: string, predicate: string) =>
    requests.get<Profile[]>(`/follow/${username}?predicate=${predicate}`),
  updateProfile: (profile: Partial<Profile>) =>
    requests.put("/profiles", profile),
  getActivities: (username: string, predicate: string) =>
    requests.get<UserActivity[]>(
      `/profiles/${username}/activities?predicate=${predicate}`
    ),
  editName: (displayName: string) =>
    requests.put("/profiles/editName", { displayName }),
  editBio: (bio: string) => requests.put("/profiles/editBio", { bio }),
};

const Photos = {
  uploadPhotoGroup: (file: Blob, chatId: string) => {
    let formData = new FormData();
    formData.append("File", file);
    formData.append("ChatId", chatId);
    return axios.post<Photo>("photos/group", formData, {
      headers: { "Content-type": "multipart/form-data" },
    });
  },
  setMainPhotoGroup: (id: string, chatId: string) =>
    requests.post(`/photos/group/${chatId}/${id}/setMain`, {}),
  deletePhotoGroup: (id: string, chatId: string) =>
    requests.del(`/photos/group/${chatId}/${id}`),
};

const Search = {
  search: (term: string) => requests.get<SearchResult[]>(`/search/${term}`),
};

const Chats = {
  list: (params: URLSearchParams) =>
    axios
      .get<PaginatedResult<ChatDto[]>>("/direct/", { params })
      .then(responseBody),
  listMessages: (params: URLSearchParams) =>
    axios
      .get<PaginatedResult<Message[]>>("direct/messages", { params })
      .then(responseBody),
  createPrivateChat: (targetUsername: string) =>
    requests.post<ChatDto>(`/direct/`, { targetUsername }),
  getPrivateChatDetails: (chatId: string) =>
    requests.get<PrivateChat>(`/direct/privateChatDetails/${chatId}`),
  createMessage: (body: string, chatId: string, replyToMessageId: number) =>
    requests.post<Message>("/direct/messages", {
      body,
      chatId,
      replyToMessageId,
    }),
  createPhoto: (
    file: Blob,
    body: string,
    chatId: string,
    config: any,
    replyToMessageId: number
  ) => {
    let formData = new FormData();
    formData.append("File", file);
    formData.append("File", file);
    formData.append("Body", body);
    formData.append("ChatId", chatId);
    formData.append("ReplyToMessageId", replyToMessageId.toString());
    return axios.post<Message>("/direct/photos", formData, {
      headers: { "Content-type": "multipart/form-data" },
      ...config,
    });
  },
  createVideo: (
    file: Blob,
    body: string,
    chatId: string,
    config: any,
    replyToMessageId: number
  ) => {
    let formData = new FormData();
    formData.append("File", file);
    formData.append("Body", body);
    formData.append("ChatId", chatId);
    formData.append("ReplyToMessageId", replyToMessageId.toString());
    return axios.post<Message>("/direct/videos", formData, {
      headers: { "Content-type": "multipart/form-data" },
      ...config,
    });
  },
  createVoice: (
    file: Blob,
    chatId: string,
    config: any,
    replyToMessageId: number
  ) => {
    let formData = new FormData();
    formData.append("File", file);
    formData.append("ChatId", chatId);
    formData.append("ReplyToMessageId", replyToMessageId.toString());
    return axios.post<Message>("/direct/voices", formData, {
      headers: { "Content-type": "multipart/form-data" },
      ...config,
    });
  },
  createChannel: (name: string, description: string) =>
    requests.post<ChatDto>("/channel/", { name, description }),
  getChannelDetails: (id: string) =>
    requests.get<ChannelDetailsDto>(`/channel/${id}`),
  addMembers: (id: string, members: string[]) =>
    requests.post<GroupMember[]>("direct/addMember", { id, members }),
  createGroup: (name: string, members: string[]) =>
    requests.post<ChatDto>("/group/", { name, members }),
  getGroupDetails: (id: string) =>
    requests.get<GroupDetailsDto>(`/group/${id}`),
  updateSeen: (chatId: string, newLastSeen: Date) =>
    requests.post<boolean>(`direct/updateSeen`, { chatId, newLastSeen }),
  removeMember: (chatId: string, username: string) =>
    requests.post<boolean>(`direct/removeMember/`, { chatId, username }),
  updateMembersPermissions: (
    chatId: string,
    permissions: GroupMemberPermissions
  ) =>
    requests.put<boolean>(`group/updateMembersPermissions`, {
      chatId,
      ...permissions,
    }),
  updateMemberPermissions: (
    chatId: string,
    permissions: GroupMemberPermissions,
    targetUsername: string
  ) =>
    requests.put<GroupMemberPermissions>(`group/updateMemberPermissions`, {
      chatId,
      ...permissions,
      targetUsername,
    }),
  addPin: (chatId: string, messageId: number, isMutual: boolean) =>
    requests.post<Pin>("direct/addPin", { chatId, messageId, isMutual }),
  removePin: (chatId: string, pinId: number) =>
    requests.post<boolean>("direct/removePin", { chatId, pinId }),
  forwardMessages: (
    chatIds: string[],
    messageIds: number[],
    srcChatId: string,
    body: string,
    showSender: boolean
  ) =>
    requests.post<boolean>("direct/forward", {
      chatIds,
      messageIds,
      srcChatId,
      body,
      showSender,
    }),
  updateAdminPermissions: (
    chatId: string,
    targetUsername: string,
    permissions: AdminPermissions
  ) =>
    requests.put<void>("group/updateAdminPermissions", {
      chatId,
      targetUsername,
      ...permissions,
    }),
  dismissAdmin: (chatId: string, targetUsername: string) =>
    requests.put<void>("group/dismissAdmin", { chatId, targetUsername }),
  deleteMessage: (chatId: string, messageId: number) =>
    requests.put<void>("direct/deleteMessage", { chatId, messageId }),
  startTyping: (chatId: string) =>
    requests.put<void>("direct/typing", { chatId }),
  stopTyping: (chatId: string) =>
    requests.put<void>("direct/stopTyping", { chatId }),
  createSavedChat: () => requests.post<ChatDto>("direct/savedMessagesChat", {}),
  updateGroupDetails: (
    chatId: string,
    displayName: string,
    description: string
  ) =>
    requests.put<void>("/group/updateDetails", {
      chatId,
      displayName,
      description,
    }),
  get: (chatId: string) => requests.get<ChatDto>(`/direct/chat/${chatId}`),
  leaveGroup: (chatId: string) => requests.del<void>(`/group/${chatId}`),
};

const agent = {
  Activities,
  Account,
  Profiles,
  Search,
  Chats,
  Photos,
};

export default agent;
