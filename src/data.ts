/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionIntent, Intersection, Handshake, CourseRecognition } from './types';

export const initialActionIntents: ActionIntent[] = [
  {
    id: 'intent-careers-1',
    domain: 'Career Services',
    agent: 'Secretary Agent',
    actor: 'Secretary Agent',
    actionType: 'Outreach',
    targetPersonOrResource: 'Maya Chen',
    proposedTime: 'Proposed: July 25, 2026',
    declaredPurpose: 'Identifying and preparing an invitation to Maya Chen, Director of AI Partnerships at Google, for AI Careers Week.',
    intendedAudience: 'Alumni & Students',
    requestedScope: 'Speaker session on AI career trajectories',
    authorityOwner: 'Alumni Relations',
    sourceSystem: 'Symplicity ERP',
    executionStatus: 'flagged'
  },
  {
    id: 'intent-lab-1',
    domain: 'Innovation Lab',
    agent: 'Hackathon Agent',
    actor: 'Hackathon Agent',
    actionType: 'Outreach',
    targetPersonOrResource: 'Maya Chen',
    proposedTime: 'Proposed: Oct 12, 2026',
    declaredPurpose: 'Preparing keynote outreach to Maya Chen for a Business Innovation Hackathon.',
    intendedAudience: 'Competitors & Judges',
    requestedScope: 'Opening Keynote Speech',
    authorityOwner: 'Lab Director',
    sourceSystem: 'Trello Board #4',
    executionStatus: 'flagged'
  },
  {
    id: 'intent-research-1',
    domain: 'AI Research Center',
    agent: 'Program Agent',
    actor: 'Program Agent',
    actionType: 'Event Planning',
    targetPersonOrResource: 'Maya Chen',
    proposedTime: '8 days ago (Completed)',
    declaredPurpose: 'Planned another AI governance event (Note: Maya Chen spoke at a campus seminar eight days ago).',
    intendedAudience: 'Graduate Researchers',
    requestedScope: 'Panel discussion & Governance debate',
    authorityOwner: 'Research Council',
    sourceSystem: 'Indico Seminar Manager',
    executionStatus: 'completed'
  },
  {
    id: 'intent-course-analytics',
    domain: 'Course Domains',
    agent: 'Marketing Analytics Project Agent',
    actor: 'Marketing Analytics Project Agent',
    actionType: 'Publish',
    targetPersonOrResource: 'ShelfSense Project',
    proposedTime: 'June 30, 2026',
    declaredPurpose: 'Published twelve final student projects under different access policies.',
    intendedAudience: 'Academic Directory',
    requestedScope: 'Abstract & Methodology public, Prototype private',
    authorityOwner: 'Marketing Course Coordinator',
    sourceSystem: 'Canvas LMS',
    executionStatus: 'completed'
  },
  {
    id: 'intent-course-discovery',
    domain: 'Course Domains',
    agent: 'AI for Business Student Discovery Agent',
    actor: 'AI for Business Student Discovery Agent',
    actionType: 'Research Request',
    targetPersonOrResource: 'ShelfSense Project',
    proposedTime: 'Current Request',
    declaredPurpose: 'Searching for student projects using AI for consumer research and real user testing.',
    intendedAudience: 'Course researchers',
    requestedScope: 'Prototype demo & research methodology',
    authorityOwner: 'AI Business Faculty',
    sourceSystem: 'Canvas LMS Agent API',
    executionStatus: 'active'
  }
];

export const initialIntersections: Intersection[] = [
  {
    id: 'intersection-relationship',
    type: 'relationship_collision',
    title: 'Relationship Collision: Maya Chen Outreach',
    description: 'Duplicate outreach vectors detected targeting Maya Chen across Innovation Lab and Career Services. Alumni Relations is the official relationship owner.',
    affectedIntents: ['intent-careers-1', 'intent-lab-1', 'intent-research-1'],
    status: 'open'
  },
  {
    id: 'intersection-resource',
    type: 'cross_course_authorization',
    title: 'Cross-Course Resource Authorization: ShelfSense',
    description: 'AI for Business Student Discovery Agent requests access to Marketing Analytics project "ShelfSense". Requires evaluation under multi-tier sharing policies.',
    affectedIntents: ['intent-course-analytics', 'intent-course-discovery'],
    status: 'open'
  }
];

export const initialHandshakes: Handshake[] = [
  {
    id: 'handshake-past-1',
    requestingDomain: 'Innovation Lab',
    resourceOrRelationshipOwner: 'Alumni Relations',
    declaredPurpose: 'Mentorship request for AI founders cohort',
    requestedScope: 'Direct calendar booking (30 mins)',
    governingPolicy: 'Alumni Mentorship Guidelines v1.2',
    approvedBy: 'Alumni Relations Director (Human)',
    finalAction: 'Coordinated Google Calendar Invite sent',
    expiration: 'None',
    revocationStatus: 'active',
    provenanceTrail: [
      'Lab Agent queried alumni mentors database.',
      'Alumni Relations Resolver detected active alum status.',
      'Approved via Alumni Relations manual dashboard.'
    ]
  },
  {
    id: 'handshake-past-2',
    requestingDomain: 'AI Research Center',
    resourceOrRelationshipOwner: 'Course Domains (CS101)',
    declaredPurpose: 'Aggregating student project counts for funding reports',
    requestedScope: 'Anonymized total metadata',
    governingPolicy: 'FERPA Aggregation Policy Sec 4',
    approvedBy: 'CS101 Faculty Agent (Automated)',
    finalAction: 'Anonymized dataset exported',
    expiration: '2026-09-01',
    revocationStatus: 'active',
    provenanceTrail: [
      'Research Center Agent triggered metadata scan.',
      'CS101 Policy checker confirmed compliance under auto-approval.',
      'Data streamed securely to Research ledger.'
    ]
  }
];

export const initialCourseRecognitions: CourseRecognition[] = [
  {
    id: 'recognition-1',
    eventName: 'AI Governance & Public Policy (Lecture by Dr. Aris)',
    publishingDomain: 'AI Research Center',
    courses: [
      {
        courseName: 'AI for Business',
        agentName: 'AI for Business Course Agent',
        rule: 'Attendance plus 250-word reflection log submitted via LMS.',
        outcome: 'Allocates 2 participation points automatically'
      },
      {
        courseName: 'Product Management',
        agentName: 'Product Management Course Agent',
        rule: 'Attendance counted under external guest speaker events.',
        outcome: 'Counts as 1 external learning activity (0 points)'
      },
      {
        courseName: 'Marketing Analytics',
        agentName: 'Marketing Analytics Course Agent',
        rule: 'No curriculum rule matched for Governance topics.',
        outcome: 'No action'
      }
    ]
  }
];
