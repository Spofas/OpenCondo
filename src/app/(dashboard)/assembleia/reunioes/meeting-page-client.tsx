"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MeetingList } from "./meeting-list";
import { MeetingForm } from "./meeting-form";

export interface AgendaItemData {
  id: string;
  order: number;
  title: string;
  description: string | null;
}

export interface AttendeeData {
  userId: string;
  userName: string;
  status: string;
  permilagem: number;
  representedBy: string | null;
}

export interface VoteData {
  agendaItemId: string;
  unitId: string;
  unitIdentifier: string;
  vote: string;
  permilagem: number;
}

export interface MeetingData {
  id: string;
  date: string;
  location: string;
  type: string;
  status: string;
  agendaItems: AgendaItemData[];
  attendees: AttendeeData[];
  votes: VoteData[];
  hasAta: boolean;
  ataContent: string | null;
}

export interface UnitData {
  id: string;
  identifier: string;
  permilagem: number;
  ownerName: string | null;
}

export interface MemberData {
  userId: string;
  userName: string;
}

export function MeetingPageClient({
  meetings,
  units,
  members,
  isAdmin,
}: {
  meetings: MeetingData[];
  units: UnitData[];
  members: MemberData[];
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assembleias</h1>
          <p className="text-sm text-muted-foreground">
            Reuniões de condóminos
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Agendar assembleia
          </button>
        )}
      </div>

      <MeetingList
        meetings={meetings}
        units={units}
        members={members}
        isAdmin={isAdmin}
      />

      {showForm && <MeetingForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
