import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Calendar as CalendarIcon, MapPin, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { Job } from "@shared/schema";
import { format, isSameDay } from "date-fns";

export default function AdminCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: allJobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const jobsWithDates = allJobs?.filter((job) => job.appointmentDateTime) || [];

  const jobsOnSelectedDate = selectedDate
    ? jobsWithDates.filter((job) =>
        isSameDay(new Date(job.appointmentDateTime!), selectedDate)
      )
    : [];

  const getDatesWithJobs = () => {
    return jobsWithDates.map((job) => new Date(job.appointmentDateTime!));
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      requested: "bg-blue-500",
      accepted: "bg-blue-600",
      deposit_due: "bg-yellow-500",
      confirmed: "bg-green-500",
      completed: "bg-purple-500",
      cancelled: "bg-red-500",
    };
    return statusColors[status] || "bg-gray-500";
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={getStatusColor(status)} data-testid={`badge-status-${status}`}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const modifiers = {
    hasJobs: getDatesWithJobs(),
  };

  const modifiersClassNames = {
    hasJobs: "bg-primary/10 font-semibold",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-8 w-8" />
              Appointment Calendar
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage scheduled appointments
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    className="rounded-md border"
                    data-testid="calendar-view"
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold">Legend:</p>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary/10" />
                      <span className="text-xs">Has appointments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                  </CardTitle>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      {jobsOnSelectedDate.length} appointment{jobsOnSelectedDate.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedDate ? (
                    <div className="py-12 text-center text-muted-foreground">
                      Select a date to view appointments
                    </div>
                  ) : jobsOnSelectedDate.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      No appointments scheduled for this date
                    </div>
                  ) : (
                    <div className="space-y-4" data-testid="div-appointments-list">
                      {jobsOnSelectedDate
                        .sort((a, b) => 
                          new Date(a.appointmentDateTime!).getTime() - 
                          new Date(b.appointmentDateTime!).getTime()
                        )
                        .map((job) => (
                          <Card key={job.id} className="border-l-4" style={{ borderLeftColor: getStatusColor(job.status).replace('bg-', '#') }} data-testid={`card-appointment-${job.id}`}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-base">{job.title}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {job.serviceType}
                                    </Badge>
                                    {job.isUrgent === "true" && (
                                      <Badge className="bg-orange-500 text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        URGENT
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {getStatusBadge(job.status)}
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {new Date(job.appointmentDateTime!).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <span>{job.location}</span>
                                </div>
                                {job.estimatedPrice && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-primary">
                                      ${job.estimatedPrice} (est.)
                                    </span>
                                    {job.depositStatus === "paid" && (
                                      <Badge variant="outline" className="text-xs">
                                        Deposit paid
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {job.customerEmail && (
                                  <div className="text-xs text-muted-foreground">
                                    Customer: {job.customerEmail}
                                  </div>
                                )}
                              </div>

                              {job.rescheduleCount != null && job.rescheduleCount > 0 && (
                                <div className="mt-3 text-xs text-muted-foreground">
                                  Rescheduled {job.rescheduleCount} time{job.rescheduleCount !== 1 ? "s" : ""}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Status Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-blue-500" />
                  <span className="text-sm">Requested</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-blue-600" />
                  <span className="text-sm">Accepted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-yellow-500" />
                  <span className="text-sm">Deposit Due</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-green-500" />
                  <span className="text-sm">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-purple-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-red-500" />
                  <span className="text-sm">Cancelled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
