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

interface Event {
  id: string;
  startDate: Date;
  endDate: Date;
  title: string;
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
      const events: Event[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Raw event data from Firestore:", data);

        const startDate = convertToDate(data.startDate);
        const endDate = convertToDate(data.endDate);

        console.log("Processed startDate:", startDate);
        console.log("Processed endDate:", endDate);
        console.log("Is startDate valid?", !isNaN(startDate.getTime()));
        console.log("Is endDate valid?", !isNaN(endDate.getTime()));

        return {
          id: doc.id,
          startDate,
          endDate,
          title: data.title || 'Untitled Event',
        };
      }) as Event[];

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

        console.log("Processed startDate for new event:", startDate);
        console.log("Processed endDate for new event:", endDate);
        console.log("Is startDate valid?", !isNaN(startDate.getTime()));
        console.log("Is endDate valid?", !isNaN(endDate.getTime()));

        const docRef = await addDoc(collection(db, 'events'), {
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
          title: newEvent.title,
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
          const eventDoc = doc(collection(db, 'events'), id);
          console.log("Updating event with ID:", id, "Changes:", changed[id]);

          const updatedChanges = changed[id];
          const startDate = updatedChanges.startDate ? new Date(updatedChanges.startDate) : new Date();
          const endDate = updatedChanges.endDate ? new Date(updatedChanges.endDate) : new Date();

          console.log("Processed startDate for update:", startDate);
          console.log("Processed endDate for update:", endDate);
          console.log("Is startDate valid?", !isNaN(startDate.getTime()));
          console.log("Is endDate valid?", !isNaN(endDate.getTime()));

          await updateDoc(eventDoc, {
            ...updatedChanges,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
          });

          setData((prevData) =>
            prevData.map((event) =>
              event.id === id ? { ...event, ...updatedChanges, startDate, endDate } : event
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
        console.log("Deleting event with ID:", deleted);
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
