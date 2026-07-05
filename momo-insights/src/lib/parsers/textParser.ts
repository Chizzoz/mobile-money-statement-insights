import { parseStatementText } from "@/lib/parsers/airtelParser";
import type { ParseResult } from "@/lib/types/transaction";

export function parseTextStatement(rawText: string): ParseResult {
  return parseStatementText(rawText);
}
