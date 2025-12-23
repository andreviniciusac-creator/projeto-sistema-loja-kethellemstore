import { Purchase } from "../types";

export const xmlParser = {
  /**
   * Parses a Brazilian NF-e XML string into a Purchase object.
   */
  parseNFe: (xmlString: string): Partial<Purchase> => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    try {
      // Basic info from NF-e
      // <emit><xNome> -> Supplier Name
      // <vNF> -> Total Value
      // <nNF> -> Invoice Number
      // <dhEmi> -> Date
      // <infNFe Id="NFe..."> -> Access Key
      
      const supplierName = xmlDoc.getElementsByTagName("xNome")[0]?.textContent || "Desconhecido";
      const cnpj = xmlDoc.getElementsByTagName("CNPJ")[0]?.textContent || "";
      const totalValue = parseFloat(xmlDoc.getElementsByTagName("vNF")[0]?.textContent || "0");
      const invoiceNumber = xmlDoc.getElementsByTagName("nNF")[0]?.textContent || "N/A";
      const dateString = xmlDoc.getElementsByTagName("dhEmi")[0]?.textContent || new Date().toISOString();
      const infNFe = xmlDoc.getElementsByTagName("infNFe")[0];
      const xmlKey = infNFe?.getAttribute("Id")?.replace("NFe", "") || "";

      return {
        id: Date.now().toString(),
        supplierName,
        cnpj,
        totalValue,
        invoiceNumber,
        xmlKey,
        date: dateString,
        importedAt: new Date().toISOString()
      };
    } catch (e) {
      console.error("Error parsing XML", e);
      throw new Error("O arquivo XML fornecido não é uma NF-e válida.");
    }
  }
};