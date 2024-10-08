import { useState, useEffect } from 'react';
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  Appointments,
  AppointmentForm,
  Toolbar,
  DateNavigator,
  ViewSwitcher,
  AllDayPanel,
} from '@devexpress/dx-react-scheduler-material-ui';
import { EditingState, IntegratedEditing, ChangeSet } from '@devexpress/dx-react-scheduler';
import { ViewState } from '@devexpress/dx-react-scheduler';
import { db } from './firebase/firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { RRule, RRuleSet } from 'rrule';

interface Event {
  id: string;
  startDate: Date;
  endDate: Date;
  title: string;
  rRule?: string;
  exDate?: string;
}

const convertToDate = (timestamp: Timestamp | string | undefined): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
};

const Calendar = () => {
  const [currentView, setCurrentView] = useState<string>('Month');
  const [data, setData] = useState<Event[]>([]);

  const fetchData = async () => {
    try {
      console.log("Fetching data from Firestore...");
      const querySnapshot = await getDocs(collection(db, 'events'));
      const events: Event[] = [];

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log("Raw event data from Firestore:", data);

        const startDate = convertToDate(data.startDate);
        const endDate = convertToDate(data.endDate);

        const baseEvent = {
          id: doc.id,
          startDate,
          endDate,
          title: data.title || 'Untitled Event',
        };

        if (data.rRule) {
          const rruleSet = new RRuleSet();
          rruleSet.rrule(new RRule({
            ...RRule.parseString(data.rRule),
            dtstart: startDate,
          }));

          rruleSet.all().forEach((date) => {
            events.push({
              ...baseEvent,
              startDate: date,
              endDate: new Date(date.getTime() + (endDate.getTime() - startDate.getTime())),
            });
          });
        } else {
          events.push(baseEvent);
        }
      });

      console.log("Processed event data:", events);
      setData(events);
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const commitChanges = async (changes: ChangeSet) => {
    const { added, changed, deleted } = changes;
  
    if (added) {
      try {
        const newEvent = { ...added };
        console.log("Adding new event:", newEvent);
  
        const startDate = newEvent.startDate ? new Date(newEvent.startDate) : new Date();
        const endDate = newEvent.endDate ? new Date(newEvent.endDate) : new Date();
  
        const docRef = await addDoc(collection(db, 'events'), {
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
          title: newEvent.title || 'Wydarzenie bez nazwy',
          rRule: newEvent.rRule || '',
          exDate: newEvent.exDate || '',
        });
  
        setData((prevData) => [
          ...prevData,
          { ...newEvent, id: docRef.id, startDate, endDate, title: newEvent.title }
        ]);
      } catch (error) {
        console.error("Błąd podczas dodawania nowego wydarzenia:", error);
      }
    }
  
    if (changed) {
      try {
        for (const id of Object.keys(changed)) {
          const updatedChanges = { ...changed[id] };
          const eventDoc = doc(collection(db, 'events'), id);
  
          const existingEvent = data.find(event => event.id === id);
          if (!existingEvent) continue;
  
          const startDate = updatedChanges.startDate
            ? new Date(updatedChanges.startDate)
            : existingEvent.startDate;
          const endDate = updatedChanges.endDate
            ? new Date(updatedChanges.endDate)
            : existingEvent.endDate;
  
          await updateDoc(eventDoc, {
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            title: updatedChanges.title || existingEvent.title,
            rRule: updatedChanges.rRule || existingEvent.rRule || '',
            exDate: updatedChanges.exDate || existingEvent.exDate || '',
          });
  
          setData((prevData) =>
            prevData.map((event) =>
              event.id === id
                ? { ...event, ...updatedChanges, startDate, endDate }
                : event
            )
          );
        }
      } catch (error) {
        console.error("Błąd podczas aktualizowania wydarzenia:", error);
      }
    }
  
    if (deleted !== undefined) {
      try {
        const eventDoc = doc(collection(db, 'events'), deleted as string);
        await deleteDoc(eventDoc);
        setData((prevData) => prevData.filter((event) => event.id !== deleted));
      } catch (error) {
        console.error("Błąd podczas usuwania wydarzenia:", error);
      }
    }
  };
  
  return (
    <Scheduler data={data} locale="pl-PL">
      <ViewState
        currentViewName={currentView}
        onCurrentViewNameChange={setCurrentView}
      />
      <EditingState onCommitChanges={commitChanges} />
      <IntegratedEditing />
      <Toolbar />
      <DateNavigator />
      <ViewSwitcher />
      <DayView startDayHour={0} endDayHour={24} />
      <WeekView startDayHour={0} endDayHour={24} />
      <MonthView />
      <AllDayPanel />
      <Appointments />
      <AppointmentForm />
    </Scheduler>
  );
};

export default Calendar;
