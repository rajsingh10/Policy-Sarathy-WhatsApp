import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BaseLoading } from "../BaseLoading";
import {
  Users,
  Send,
  FileText,
  Clock,
  Target,
  Tag,
  Folder,
  Loader2,
  MessageSquare,
  Eye,
  ArrowUp,
} from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserTemplate } from "../../features/templates/templatesSlice";
import { fetchContacts } from "../../features/contacts/contactSlice";
import { getContacts } from "../../services/contactService";
import { ContactSelectionModal } from "./ContactSelectionModal";
import { sendBulkMessage } from "../../features/bulkSend/bulkSendSlice";
import { fetchGroups } from "../../features/groups/groupSlice";
import { ContactSelectionCard } from "../ContactSelectionCard";
import { useNavigate } from "react-router-dom";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  status: string;
  groupIds: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Group {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  members: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
}

interface TemplateComponent {
  type: string;
  text?: string;
  format?: string;
  example?: {
    header_handle?: string[];
    body_text?: string[][];
  };
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
  }>;
}

interface Template {
  id: string;
  name: string;
  components: TemplateComponent[];
  category: string;
  language: string;
  status: string;
  isCustom: boolean;
}

export const BulkMessageSender: React.FC = () => {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state: any) => state.auth);
  const { items: templates = [], loading: templatesLoading } = useSelector((state: any) => state.template);
  const { list: contacts = [], loading: contactsLoading, pagination: contactsPagination } = useSelector((state: any) => state.contacts);
  const { items: groups = [], loading: groupsLoading, pagination: groupsPagination } = useSelector((state: any) => state.groups);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(contacts);
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterGroups, setFilterGroups] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [campaignName, setCampaignName] = useState("");
  const [contactsPage, setContactsPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const [name, setname] = useState("");
  const [openModalForVariable, setOpenModalForVariable] = useState<
    string | null
  >(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = (e?: Event) => {
      const target = e?.target as HTMLElement | undefined;
      const scrollTop = target?.scrollTop || window.scrollY || 0;
      if (scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    const panel = leftPanelRef.current;
    if (panel) {
      panel.addEventListener("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (panel) {
        panel.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Create a map of group members for quick lookup
  const groupMembersMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    groups.forEach((group) => {
      const memberIds = new Set<string>();
      group.members?.forEach(m => memberIds.add(m.id));
      map.set(group.id, memberIds);
    });
    return map;
  }, [groups]);

  // Fetch data on component mount and when page changes
  useEffect(() => {
    if (token) {
      const delayDebounceFn = setTimeout(() => {
        dispatch(fetchUserTemplate(token));
        dispatch(fetchContacts({ token, page: contactsPage, limit: 20, search: searchTerm }));
        dispatch(fetchGroups({ token, page: groupsPage, limit: 9999 }));
      }, 400);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [dispatch, token, contactsPage, groupsPage, searchTerm]);

  // Update filtered contacts when contacts or filters change
  useEffect(() => {
    let filtered = contacts.filter((contact) => {
      const matchesSearch =
        searchTerm === "" ||
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm);

      const matchesTag =
        filterTag === "all" || contact.tags.includes(filterTag);

      // For group filtering, check if contact is in any of the selected groups
      const matchesGroups =
        filterGroups.length === 0 ||
        filterGroups.some((groupId) =>
          groupMembersMap.get(groupId)?.has(contact.id)
        );

      return matchesSearch && matchesTag && matchesGroups;
    });
    setFilteredContacts(filtered);
  }, [searchTerm, filterTag, filterGroups, contacts, groupMembersMap]);

  // When filterGroups change, auto-select all members from selected groups
  // without removing users' manual deselections that are outside these groups
  useEffect(() => {
    if (filterGroups.length === 0) return;

    const memberIdsFromGroups = new Set<string>();
    filterGroups.forEach((groupId) => {
      (groupMembersMap.get(groupId) || new Set()).forEach((id) =>
        memberIdsFromGroups.add(id)
      );
    });

    setSelectedContacts((prev) => {
      // Merge previously selected with new group members
      const merged = new Set<string>(prev);
      memberIdsFromGroups.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
  }, [filterGroups, groupMembersMap]);

  // Extract variables from the template
  const extractVariables = (template: Template) => {
    const bodyVariables: string[] = [];
    const buttonVariables: string[] = [];
    const headerVariables: string[] = [];

    template.components.forEach((component) => {
      if (component.type === "HEADER") {
        if (component.format !== "TEXT") {
          if (component.text) {
            headerVariables.push("{{header_text}}");
          } else if (
            component.format === "IMAGE" ||
            component.format === "VIDEO" ||
            component.format === "DOCUMENT"
          ) {
            headerVariables.push("{{header_media_url}}");
          }
        }
      } else if (component.type === "BODY") {
        const textVariables = component.text?.match(/\{\{(\d+)\}\}/g) || [];
        bodyVariables.push(...textVariables);
      } else if (component.type === "BUTTONS") {
        component.buttons?.forEach((button) => {
          const buttonTextVariables =
            button.text?.match(/\{\{(\d+)\}\}/g) || [];
          const buttonUrlVariables = button.url?.match(/\{\{(\d+)\}\}/g) || [];
          buttonVariables.push(...buttonTextVariables, ...buttonUrlVariables);
        });
      }
    });

    // Assign distinct numbers to button variables
    const uniqueButtonVariables = [...new Set(buttonVariables)];
    const numberedButtonVariables = uniqueButtonVariables.map(
      (variable, index) => {
        const buttonIndex = index + bodyVariables.length + 1;
        return variable.replace(/\d+/, buttonIndex.toString());
      }
    );

    return {
      headerVariables,
      bodyVariables: [...new Set(bodyVariables)],
      buttonVariables: numberedButtonVariables,
    };
  };

  // Generate a preview of the message
  const generatePreview = () => {
    if (!selectedTemplate) return "";
    let preview = "";
    const { bodyVariables, buttonVariables, headerVariables } =
      extractVariables(selectedTemplate);

    selectedTemplate.components.forEach((component) => {
      switch (component.type) {
        case "HEADER":
          if (component.format === "TEXT") {
            const headerText =
              variableValues["{{header_text}}"] || component.text || "";
            preview += `<div class="px-2 pt-2 text-sm font-bold text-gray-900">${headerText}</div>`;
          } else if (
            component.format === "IMAGE" ||
            component.format === "VIDEO" ||
            component.format === "DOCUMENT"
          ) {
            const mediaUrl =
              variableValues["{{header_media_url}}"] ||
              component.example?.header_handle?.[0] ||
              "";

            if (component.format === "IMAGE") {
              preview += `
          <div class="p-1">
            <img src="${mediaUrl || 'https://placehold.co/600x400?text=Image+Preview'}" alt="Header Image" class="w-full max-h-48 rounded-lg object-cover" />
          </div>
        `;
            } else if (component.format === "VIDEO") {
              preview += `
       <div class="p-[2px] flex justify-center">
  <video controls class="w-full rounded-lg bg-black">
    <source src="${mediaUrl}" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>
        `;
            } else if (component.format === "DOCUMENT") {
              preview += `
          <div class="p-2 flex items-center bg-gray-100 rounded-md mx-[2px] mt-[2px]">
            <svg class="w-8 h-8 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path></svg>
            <a href="${mediaUrl}" target="_blank" class="text-sm underline text-blue-600 truncate block">
              Document Attachment
            </a>
          </div>
        `;
            }
          }
          break;
        case "BODY":
          let bodyText = component.text || "";
          bodyVariables.forEach((variable) => {
            const value = variableValues[variable] || variable;
            bodyText = bodyText.replace(
              new RegExp(variable.replace(/[{}]/g, "\\$&"), "g"),
              value
            );
          });
          preview += `<div class="px-3 pb-2 pt-1 text-[14.2px] leading-snug text-gray-900 whitespace-pre-wrap">${bodyText}</div>`;
          break;
        case "FOOTER":
          if (component.text) {
            preview += `<div class="px-3 pb-2 pt-0 text-[11px] text-gray-500">${component.text}</div>`;
          }
          break;
        case "BUTTONS":
          component.buttons?.forEach((button) => {
            let buttonText = button.text || "";
            buttonVariables.forEach((variable) => {
              const value = variableValues[variable] || variable;
              buttonText = buttonText.replace(
                new RegExp(variable.replace(/[{}]/g, "\\$&"), "g"),
                value
              );
            });
            preview += `<div class="border-t border-gray-200 mt-1 py-2 text-center text-[#00a884] font-medium text-[14.5px] hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-center gap-2">
               ${button.type === 'URL' ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>' : ''}
               ${button.type === 'PHONE_NUMBER' ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>' : ''}
               ${button.type === 'QUICK_REPLY' ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>' : ''}
               ${buttonText}
            </div>`;
          });
          break;
      }
    });
    return preview;
  };

  // Toggle contact selection
  const handleContactToggle = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Select/deselect all contacts
  const handleSelectAll = async () => {
    const allFilteredIds = filteredContacts.map((c) => c.id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedContacts.includes(id));

    if (areAllSelected) {
      // Deselect all
      setSelectedContacts([]);
      setFilterGroups([]);
    } else {
      try {
        setIsSelectingAll(true);
        // Fetch all contacts to get their IDs
        const res = await getContacts(token, 1, 999999, searchTerm);
        let allIds = [];
        if (res && res.contacts && res.contacts.data) {
          allIds = res.contacts.data.map((c: any) => c.id);
        } else if (res && res.data) {
          allIds = res.data.map((c: any) => c.id);
        } else {
          // Fallback to currently visible if structure is unexpected
          allIds = allFilteredIds;
        }

        const newSelected = new Set([...selectedContacts, ...allIds]);
        setSelectedContacts(Array.from(newSelected));
        toast.success(`Selected ${allIds.length} contacts`);
      } catch (error) {
        console.error("Failed to fetch all contacts for selection", error);
        toast.error("Failed to select all contacts");
      } finally {
        setIsSelectingAll(false);
      }
    }
  };

  // Handle selecting multiple contacts
  const handleSelectContacts = (contactIds: string[]) => {
    setSelectedContacts(contactIds);
  };

  // Select all members of a group
  const handleSelectGroup = (groupId: string) => {
    const memberIds = Array.from(groupMembersMap.get(groupId) || []);
    setSelectedContacts((prev) => {
      // If all members are already selected, deselect them
      if (memberIds.every((id) => prev.includes(id))) {
        return prev.filter((id) => !memberIds.includes(id));
      }
      // Otherwise select all members
      return [...new Set([...prev, ...memberIds])];
    });
  };

  // Check if all members of a group are selected
  const areAllGroupMembersSelected = (groupId: string) => {
    const memberIds = Array.from(groupMembersMap.get(groupId) || []);
    return (
      memberIds.length > 0 &&
      memberIds.every((id) => selectedContacts.includes(id))
    );
  };

  // Get group name from group ID
  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  // Get group members
  const getGroupMembers = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.members || [] : [];
  };

  // Handle sending the bulk message
  const handleSend = async () => {
    if (!selectedTemplate || selectedContacts.length === 0) {
      toast.error("Please select a template and contacts");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    const { headerVariables, bodyVariables, buttonVariables } =
      extractVariables(selectedTemplate);

    // Check for missing variables
    const allVariables = [
      ...headerVariables,
      ...bodyVariables,
      ...buttonVariables,
    ];
    const missingVariables = allVariables.filter(
      (variable) => !variableValues[variable]?.trim()
    );

    if (missingVariables.length > 0) {
      toast.error(
        `Please fill in all required variables: ${missingVariables.join(", ")}`
      );
      return;
    }

    setIsSending(true);
    setSendingProgress(0);

    // Start progress simulation
    const progressInterval = setInterval(() => {
      setSendingProgress((prev) => {
        if (prev >= 90) {
          return prev; // Stop at 90% until API call completes
        }
        return prev + Math.random() * 15; // Increment by random amount between 0-15
      });
    }, 200); // Update every 200ms

    try {
      // Format button variables based on template type
      let formattedButtonVariables: string[] = [];

      // map button variables to their values
      formattedButtonVariables = buttonVariables.map(
        (variable) => variableValues[variable] || ""
      );

      // Format body variables
      const formattedBodyVariables = bodyVariables.map(
        (variable) => variableValues[variable] || ""
      );

      // Format header variables
      const formattedHeaderVariables = headerVariables.map(
        (variable) => variableValues[variable] || ""
      );

      const payload = {
        name,
        templateId: selectedTemplate.id,
        headerVariables: formattedHeaderVariables,
        bodyVariables: formattedBodyVariables,
        buttonVariables: formattedButtonVariables,
        scheduleAt: isScheduled ? scheduledTime : null,
        contactIds: selectedContacts,
      };

      const resultAction = await dispatch(
        sendBulkMessage({ token, groupData: payload })
      );

      // Clear the progress interval
      clearInterval(progressInterval);

      // Complete the progress bar
      setSendingProgress(100);

      // Wait a moment to show 100% completion
      setTimeout(() => {
        if (sendBulkMessage.fulfilled.match(resultAction)) {
          toast.success(
            `Campaign "${name}" sent successfully to ${selectedContacts.length} contacts!`
          );
          navigate("/campaigns");
        } else {
          const errorMessage =
            (resultAction.payload as { error?: string })?.error ||
            (resultAction.payload as string) ||
            "Failed to send campaign";
          toast.error(errorMessage);
        }
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      toast.error("An error occurred while sending the campaign");
    } finally {
      // Reset after a delay to show completion
      setTimeout(() => {
        setIsSending(false);
        setSendingProgress(0);
        setSelectedTemplate(null);
        setSelectedContacts([]);
        setVariableValues({});
        setname("");
      }, 2000);
    }
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(contacts.flatMap((contact) => contact.tags))
  );

  const isLoadingData = templatesLoading || contactsLoading || groupsLoading;

  const isInitialLoad =
    (templatesLoading && templates.length === 0) ||
    (groupsLoading && groups.length === 0) ||
    (contactsLoading && contacts.length === 0 && searchTerm === "");

  if (isInitialLoad) {
    return (
      <BaseLoading />
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4 flex flex-col h-[calc(100vh-6.5rem)] relative">
      {/* Header */}
      {/* <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Bulk Message Sender
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Reach multiple contacts efficiently with personalized messages
        </p>
      </div> */}

      <div className="grid gap-2 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] flex-1 overflow-hidden pb-20 lg:pb-14">
        {/* Configuration */}
        <div
          className="space-y-3 sm:space-y-6 overflow-y-auto pr-2 hide-scrollbar pb-4 lg:pb-0"
          ref={leftPanelRef}
        >
          {/* Campaign Setup */}
          <Card className="card-elegant">


            <CardHeader className="px-2 sm:px-6 pt-2 pb-1 sm:pt-4 sm:pb-2 flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-4">
              <div>
                <CardTitle>Campaign Setup</CardTitle>
                <CardDescription>
                  Configure your bulk message campaign
                </CardDescription>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
                <div className="flex items-center space-x-2 mt-1 cursor-pointer">
                  <Checkbox
                    id="schedule"
                    checked={isScheduled}
                    onCheckedChange={(checked) =>
                      setIsScheduled(checked as boolean)
                    }
                  />
                  <Label htmlFor="schedule" className="whitespace-nowrap cursor-pointer">Schedule for later</Label>
                </div>
                {isScheduled && (
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()}
                    className="w-full sm:w-56"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 space-y-3 sm:space-y-4 pt-1 sm:pt-2 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setname(e.target.value)}
                    placeholder="Enter campaign name (e.g., Holiday Sale 2024)"
                  />
                  <div className="mt-1 border-l-4 border-blue-400 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                    <span className="font-semibold">Example:</span> Product
                    Launch, Event Invitation, Holiday Sale 2025
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Template</Label>

                  <Select
                    value={selectedTemplate?.id || ""}
                    onValueChange={(templateId) => {
                      const template = templates.find((t) => t.id === templateId);
                      setSelectedTemplate(template || null);
                      setVariableValues({});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a message template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter((t) => t.status === "APPROVED").length > 0 ? (
                        templates
                          .filter((t) => t.status === "APPROVED")
                          .map((template) => (
                            <SelectItem
                              className="px-2 py-2"
                              key={template.id}
                              value={template.id}
                            >
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span className="truncate w-44 sm:w-48 md:w-96">
                                  {template.name}
                                </span>{" "}
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
                          <span>No templates</span>

                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <div className="mt-1 border-l-4 border-blue-400 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                    <span className="font-semibold">Note:</span> Select an approved WhatsApp template to proceed.
                  </div>
                </div>
              </div>

              {selectedTemplate && (
                <div className="space-y-4">
                  {(() => {
                    const { headerVariables, bodyVariables, buttonVariables } =
                      extractVariables(selectedTemplate);
                    const variableInfoMap: Record<
                      string,
                      {
                        type: string;
                        inputType: string;
                        placeholder: string;
                      }
                    > = {};

                    // Populate variableInfoMap for header variables
                    if (headerVariables.length > 0) {
                      const headerComponent = selectedTemplate.components.find(
                        (c) => c.type === "HEADER"
                      );
                      if (headerComponent) {
                        if (headerComponent.format !== "TEXT") {
                          if (headerComponent.text) {
                            variableInfoMap["{{header_text}}"] = {
                              type: "HEADER",
                              inputType: "text",
                              placeholder: "Enter header text content",
                            };
                          } else if (
                            headerComponent.format === "IMAGE" ||
                            headerComponent.format === "VIDEO" ||
                            headerComponent.format === "DOCUMENT"
                          ) {
                            variableInfoMap["{{header_media_url}}"] = {
                              type: "HEADER",
                              inputType: "url",
                              placeholder: `Enter URL for header ${headerComponent.format.toLowerCase()}`,
                            };
                          }
                        }
                      }
                    }

                    // Populate variableInfoMap for body variables
                    bodyVariables.forEach((variable) => {
                      variableInfoMap[variable] = {
                        type: "BODY",
                        inputType: "text",
                        placeholder: `Enter value for ${variable}`,
                      };
                    });

                    // Populate variableInfoMap for button variables
                    buttonVariables.forEach((variable) => {
                      variableInfoMap[variable] = {
                        type: "BUTTONS",
                        inputType: variable.includes("url") ? "url" : "text",
                        placeholder: variable.includes("url")
                          ? `Enter URL for ${variable}`
                          : `Enter button text for ${variable}`,
                      };
                    });

                    return (
                      <div className="space-y-4">
                        {/* All Variables Section */}
                        {(headerVariables.length > 0 || bodyVariables.length > 0 || buttonVariables.length > 0) && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Message Variables
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Render Header Variables */}
                              {headerVariables.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center">
                                    <Label className="text-sm font-mono">Header</Label>
                                    <Badge variant="secondary" className="ml-2 text-xs" style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
                                      Header
                                    </Badge>
                                  </div>
                                  {headerVariables.includes("{{header_media_url}}") ? (
                                    <>
                                      <Input
                                        type="url"
                                        value={variableValues["{{header_media_url}}"] || ""}
                                        onChange={(e) => setVariableValues({ ...variableValues, "{{header_media_url}}": e.target.value })}
                                        placeholder="Enter Header Media URL"
                                      />
                                      <div className="mt-2 border-l-4 border-blue-400 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                                        <span className="font-semibold">Note:</span> Enter a valid URL for the header media.
                                      </div>
                                    </>
                                  ) : (
                                    <Input
                                      type="text"
                                      value={variableValues["{{header_text}}"] || ""}
                                      onChange={(e) => setVariableValues({ ...variableValues, "{{header_text}}": e.target.value })}
                                      placeholder="Enter header text content"
                                    />
                                  )}
                                </div>
                              )}
                              {/* Render Body Variables */}
                              {bodyVariables.map((variable) => {
                                const info = variableInfoMap[variable];
                                const handleInsertContact = (value: string) => {
                                  setVariableValues({
                                    ...variableValues,
                                    [variable]: value,
                                  });
                                  setOpenModalForVariable(null);
                                };
                                return (
                                  <div key={variable} className="space-y-1">
                                    <div className="flex items-center">
                                      <Label className="text-sm font-mono">
                                        {variable}
                                      </Label>
                                      <Badge
                                        variant="secondary"
                                        className="ml-2 text-xs"
                                        style={{
                                          backgroundColor: "#f3f4f6",
                                          color: "#374151",
                                        }}
                                      >
                                        Body
                                      </Badge>
                                    </div>
                                    <div className="relative">
                                      <Input
                                        type={info?.inputType || "text"}
                                        value={variableValues[variable] || ""}
                                        onChange={(e) =>
                                          setVariableValues({
                                            ...variableValues,
                                            [variable]: e.target.value,
                                          })
                                        }
                                        placeholder={
                                          info?.placeholder ||
                                          `Enter value for ${variable}`
                                        }
                                        className="pr-10"
                                      />
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="ghost"
                                              className="absolute right-0 top-0 h-full hover:bg-blue-500 hover:text-white rounded-r-md"
                                              onClick={() =>
                                                setOpenModalForVariable(
                                                  variable
                                                )
                                              }
                                            >
                                              <Users className="h-4 w-4 text-muted-foreground hover:text-white" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Select Contact Detail</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                    <div className="mt-2 border-l-4 border-blue-400 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                                      <span className="font-semibold">
                                        Note:
                                      </span>{" "}
                                      Value to replace
                                      <span className="font-mono">
                                        {variable}
                                      </span>{" "}
                                      in the message
                                    </div>

                                    {openModalForVariable === variable && (
                                      <ContactSelectionModal
                                        isOpen={openModalForVariable === variable}
                                        onOpenChange={(open) => !open && setOpenModalForVariable(null)}
                                        onSelect={handleInsertContact}
                                      />
                                    )}
                                  </div>
                                );
                              })}

                              {/* Render Button Variables */}
                              {buttonVariables.map((variable) => {
                                const info = variableInfoMap[variable];
                                return (
                                  <div key={variable} className="space-y-1">
                                    <div className="flex items-center">
                                      <Label className="text-sm font-mono">
                                        {variable}
                                      </Label>
                                      <Badge
                                        variant="secondary"
                                        className="ml-2 text-xs"
                                        style={{
                                          backgroundColor: "#ddd6fe",
                                          color: "#7c3aed",
                                        }}
                                      >
                                        Button
                                      </Badge>
                                    </div>
                                    <Input
                                      type={info?.inputType || "text"}
                                      value={variableValues[variable] || ""}
                                      onChange={(e) =>
                                        setVariableValues({
                                          ...variableValues,
                                          [variable]: e.target.value,
                                        })
                                      }
                                      placeholder={
                                        info?.placeholder ||
                                        `Enter value for ${variable}`
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}




            </CardContent>
          </Card>

          {/* Contact Selection */}
          <div className="relative">
            {(contactsLoading || isSelectingAll) && (
              <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  {isSelectingAll && <span className="mt-2 text-sm font-medium text-primary">Selecting all...</span>}
                </div>
              </div>
            )}
            <ContactSelectionCard
              contacts={contacts}
              groups={groups}
              selectedContacts={selectedContacts}
              onSelectContact={handleContactToggle}
              onSelectAll={handleSelectAll}
              onSelectContacts={handleSelectContacts}
              onSearch={setSearchTerm}
              onFilterGroups={setFilterGroups}
              searchTerm={searchTerm}
              filterGroups={filterGroups}
              pagination={contactsPagination}
              onPageChange={setContactsPage}
            />
          </div>
        </div>

        {/* Summary & Send */}
        <div
          id="preview-section"
          className="lg:col-span-1 flex flex-col h-full overflow-hidden"
        >
          <div
            className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar pb-4 lg:pb-0"
          >
            {/* Message Preview */}
            {selectedTemplate && (
              <Card className="card-elegant">
                <CardHeader className="">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <MessageSquare className="w-5 h-5" />
                    <span>Message Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="">
                  <div
                    className="p-4 bg-[#e5ddd5] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-center rounded-lg border flex flex-col shadow-inner"
                    style={{ minHeight: "200px" }}
                  >
                    <div
                      className="max-w-[92%] bg-white rounded-lg pb-1 shadow-sm relative self-start"
                      style={{ borderTopLeftRadius: 0 }}
                    >
                      {/* Tail */}
                      <div className="absolute top-0 -left-2 w-2 h-3 bg-white" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}></div>

                      <div
                        className="whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: generatePreview() }}
                      />

                      <div className="text-[10.5px] text-gray-500 text-right mt-0.5 pr-3 pb-1">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="card-elegant">
              <CardHeader className="px-2 sm:px-6">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Campaign Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign</span>
                    <span className="text-foreground font-medium">
                      {name || "Untitled Campaign"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Template</span>
                    <span className="text-foreground overflow-hidden text-ellipsis font-medium max-w-[150px]">
                      {selectedTemplate?.name || "None selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipients</span>
                    <span className="text-foreground font-medium">
                      {selectedContacts.length} contacts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variables</span>
                    <span className="text-foreground font-medium">
                      {Object.keys(variableValues).length > 0
                        ? `${Object.keys(variableValues).length} configured`
                        : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={isScheduled ? "secondary" : "default"}>
                      {isScheduled ? "Scheduled" : "Ready to Send"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isSending && (
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>Sending Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {Math.round(sendingProgress)}%
                        </span>
                      </div>
                      <Progress value={sendingProgress} className="w-full h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">
                          {sendingProgress < 100
                            ? "Sending messages..."
                            : "Completed!"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Recipients</span>
                        <span className="font-medium">
                          {selectedContacts.length} contacts
                        </span>
                      </div>
                    </div>

                    {sendingProgress < 100 && (
                      <div className="text-xs text-muted-foreground text-center">
                        Please wait while we process your campaign...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="card-elegant mb-4 lg:mb-0">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Contacts</span>
                  <span className="text-foreground">{contacts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Groups</span>
                  <span className="text-foreground">{groups.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Templates Available
                  </span>
                  <span className="text-foreground">{templates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected</span>
                  <span className="text-primary font-medium">
                    {selectedContacts.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Desktop Fixed Bottom Bar */}
      <div className="hidden lg:flex fixed bottom-0 left-0 lg:left-64 right-0 z-40 bg-white dark:bg-gray-900 border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] p-3 px-4 sm:px-8 items-center justify-between">

        {/* Left Side: Contact count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              {selectedContacts.length} Contacts
            </div>
            <div className="text-xs text-muted-foreground">
              Selected for broadcast
            </div>
          </div>
        </div>

        {/* Middle: Campaign & Template details */}
        <div className="hidden xl:flex items-center gap-6 px-6 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{name || "Untitled Campaign"}</span>
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground max-w-[150px] truncate">{selectedTemplate?.name || "No template selected"}</span>
          </div>
        </div>

        {/* Right Side: Button */}
        <div className="flex items-center gap-3">
          <Button
            className="bg-gradient-primary w-48 shadow-md hover:shadow-lg transition-all"
            size="lg"
            onClick={handleSend}
            disabled={
              !selectedTemplate ||
              selectedContacts.length === 0 ||
              isSending ||
              !name.trim()
            }
          >
            {isSending ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {isScheduled ? "Schedule Campaign" : "Send Now"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden z-50 flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button
          className="flex-1 bg-gradient-primary text-white"
          onClick={handleSend}
          disabled={!selectedTemplate || selectedContacts.length === 0 || isSending || !name.trim()}
        >
          {isSending ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Sending
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isScheduled ? "Schedule" : "Send"}
            </>
          )}
        </Button>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          className="fixed bottom-20 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-gradient-primary text-white flex items-center justify-center lg:hidden"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            if (leftPanelRef.current) {
              leftPanelRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};
