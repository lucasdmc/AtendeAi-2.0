import clinicService, { ClinicContextualization } from "@/services/clinicService";

export class ContextSDK {
  async getContext(clinicId: string, forceRefresh: boolean = false): Promise<ClinicContextualization> {
    return clinicService.getClinicContextualization(clinicId, forceRefresh);
  }

  async updateContext(clinicId: string, data: Partial<ClinicContextualization>): Promise<ClinicContextualization> {
    return clinicService.updateClinicContextualization(clinicId, data);
  }
}

export const contextSDK = new ContextSDK();
