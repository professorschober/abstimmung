import type { PersonaId } from "./types";

export interface PersonaDefinition {
  id: PersonaId;
  name: string;
  title: string;
  summary: string;
  questionExamples: string[];
  accent: string;
}

export const personas: PersonaDefinition[] = [
  {
    id: "retter",
    name: "Herr Retter",
    title: "Leiter des Roten Kreuzes Lebring",
    summary:
      "Kennt die fachlichen Anforderungen zu Mitarbeitern, Fahrzeugen, Einsaetzen, Dienstplaenen und Schulungen, ist aber nicht technisch.",
    questionExamples: [
      "Welche Informationen brauchen Sie fuer einen Dienstplan?",
      "Wie wird ein Einsatz personell und mit Fahrzeugen geplant?",
      "Welche Unterschiede gibt es zwischen freiwilligen und hauptberuflichen Mitarbeitern?",
    ],
    accent: "var(--persona-retter)",
  },
  {
    id: "taler",
    name: "Frau Taler",
    title: "Finanzchefin des Roten Kreuzes Lebring",
    summary:
      "Kennt Abrechnung, Buchhaltung, Aufzeichnungen und die finanziellen Aspekte von Einsaetzen und Schulungen.",
    questionExamples: [
      "Wie werden Einsaetze verrechnet?",
      "Welche Daten brauchen Sie fuer die Buchhaltung?",
      "Welche Aufzeichnungen entstehen bei Schulungen und Dienstplaenen?",
    ],
    accent: "var(--persona-taler)",
  },
];

export function getPersona(id: PersonaId): PersonaDefinition {
  const persona = personas.find((entry) => entry.id === id);
  if (!persona) {
    throw new Error(`Unknown persona: ${id}`);
  }
  return persona;
}
