/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ActionIntent {
  id: string;
  domain: 'Career Services' | 'Innovation Lab' | 'AI Research Center' | 'Course Domains';
  agent: string;
  actor: string;
  actionType: string;
  targetPersonOrResource: string;
  proposedTime?: string;
  declaredPurpose: string;
  intendedAudience: string;
  requestedScope?: string;
  authorityOwner?: string;
  sourceSystem: string;
  executionStatus: 'pending' | 'active' | 'completed' | 'flagged';
}

export interface Intersection {
  id: string;
  type: 'relationship_collision' | 'cross_course_authorization';
  title: string;
  description: string;
  affectedIntents: string[]; // ActionIntent IDs
  status: 'open' | 'resolved_consolidated' | 'resolved_prioritized' | 'resolved_external' | 'resolved_handshake_approved' | 'resolved_handshake_rejected';
  resolutionDetails?: {
    choice: string;
    timestamp: string;
    resultSummary: string;
    generatedContent?: string; // e.g., the coordinated Gmail draft or the access grant
    provenanceTrail?: string[];
    scopedAccess?: {
      viewOnly: boolean;
      duration72h: boolean;
      noDownload: boolean;
      noRawData: boolean;
      noContactDisclosure: boolean;
    };
  };
}

export interface Handshake {
  id: string;
  requestingDomain: string;
  resourceOrRelationshipOwner: string;
  declaredPurpose: string;
  requestedScope: string;
  governingPolicy: string;
  approvedBy: string; // e.g., Human or Agent authority
  finalAction: string;
  expiration: string;
  revocationStatus: 'active' | 'revoked' | 'expired';
  provenanceTrail: string[];
}

export interface CourseRecognition {
  id: string;
  eventName: string;
  publishingDomain: string;
  courses: {
    courseName: string;
    agentName: string;
    rule: string;
    outcome: string;
  }[];
}
