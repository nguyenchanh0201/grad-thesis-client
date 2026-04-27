import type { EventItem } from "@/components/event/event-card";
import { EventStatus } from "@/schemas/event";
import type { EventDetail } from "@/schemas/event";

export const mockEvents: EventItem[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=80",
    genre: "POP",
    title: "Taylor Swift | The Eras Tour",
    date: "Mar 15, 2025",
    venue: "SoFi Stadium, Los Angeles",
    price: "From $89",
    tag: "HOT",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    genre: "R&B",
    title: "Beyoncé Renaissance World Tour",
    date: "Apr 2, 2025",
    venue: "MetLife Stadium, New Jersey",
    price: "From $120",
    tag: "FEATURED",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&q=80",
    genre: "ROCK",
    title: "Coldplay Music of the Spheres",
    date: "Apr 18, 2025",
    venue: "Wembley Stadium, London",
    price: "From $75",
  },
  {
    id: "4",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
    genre: "EDM",
    title: "Daft Punk Farewell Experience",
    date: "May 5, 2025",
    venue: "Madison Square Garden, New York",
    price: "From $95",
    tag: "NEW",
  },
  {
    id: "5",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
    genre: "HIP-HOP",
    title: "Drake & 21 Savage It's All A Blur",
    date: "May 22, 2025",
    venue: "Barclays Center, Brooklyn",
    price: "From $65",
  },
  {
    id: "6",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    genre: "COUNTRY",
    title: "Morgan Wallen One Thing at a Time",
    date: "Jun 7, 2025",
    venue: "Nissan Stadium, Nashville",
    price: "From $55",
  },
  {
    id: "7",
    image:
      "https://images.unsplash.com/photo-1478147427282-58a87a433048?w=600&q=80",
    genre: "JAZZ",
    title: "Herbie Hancock & Friends Live",
    date: "Jun 14, 2025",
    venue: "Hollywood Bowl, Los Angeles",
    price: "From $45",
  },
  {
    id: "8",
    image:
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80",
    genre: "INDIE",
    title: "Arctic Monkeys The Car Tour",
    date: "Jul 1, 2025",
    venue: "O2 Arena, London",
    price: "From $80",
    tag: "FEATURED",
  },
  {
    id: "9",
    image:
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=600&q=80",
    genre: "CLASSICAL",
    title: "Vienna Philharmonic Orchestra",
    date: "Jul 19, 2025",
    venue: "Carnegie Hall, New York",
    price: "From $110",
  },
  {
    id: "10",
    image:
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
    genre: "POP",
    title: "Billie Eilish Hit Me Hard and Soft",
    date: "Aug 3, 2025",
    venue: "Kia Forum, Los Angeles",
    price: "From $70",
    tag: "HOT",
  },
];

export const mockEventDetail: EventDetail = {
  id: "1",
  slug: "ravolution-music-festival-2026",
  title: "Ravolution Music Festival 2026",
  subtitle: "Đêm nhạc đỉnh cao với những nghệ sĩ hàng đầu Việt Nam",
  images: [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&q=80",
  ],
  dates: [
    {
      date: "2026-06-13",
      label: "Saturday 13/06/2026",
      startTime: "2026-06-13T19:00:00+07:00",
      endTime: "2026-06-13T23:00:00+07:00",
    },
    {
      date: "2026-06-14",
      label: "Sunday 14/06/2026",
      startTime: "2026-06-14T19:00:00+07:00",
      endTime: "2026-06-14T23:00:00+07:00",
    },
  ],
  venue: {
    name: "Sân Vận Động Quốc Gia Mỹ Đình",
    address: "Đường Lê Đức Thọ, Mỹ Đình, Nam Từ Liêm",
    city: "Hà Nội",
    mapUrl: "https://maps.google.com/?q=My+Dinh+National+Stadium+Hanoi",
  },
  organizer: {
    id: "1",
    name: "Ravolution Entertainment",
    logo: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&q=80",
    followerCount: 125000,
    description:
      "Ravolution Entertainment là đơn vị tổ chức sự kiện âm nhạc hàng đầu Việt Nam, với hơn 10 năm kinh nghiệm.",
  },
  description: `<h2>GIỚI THIỆU VỀ CHƯƠNG TRÌNH</h2>
<p>Ravolution Music Festival 2026 là sự kiện âm nhạc lớn nhất trong năm, quy tụ hơn 50 nghệ sĩ hàng đầu Việt Nam và quốc tế trên một sân khấu hoành tráng.</p>
<p>Với hệ thống âm thanh ánh sáng đỉnh cao và không gian sáng tạo độc đáo, đây hứa hẹn là một đêm nhạc không thể quên dành cho tất cả người yêu âm nhạc.</p>`,
  timeVenueNotes: [
    "Ngày: Thứ Bảy & Chủ Nhật, 13–14/06/2026",
    "Giờ: 19:00 – 23:00 (mở cửa từ 17:00)",
    "Địa điểm: Sân Vận Động Quốc Gia Mỹ Đình, Hà Nội",
    "Phân loại: 16+ (dưới 16 tuổi cần có người lớn đi kèm)",
  ],
  seatMapImage:
    "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=1200&q=80",
  seatMapType: "stadium",
  termsAndConditions: `<p>1. Vé đã mua không được hoàn trả hoặc đổi dưới mọi hình thức.</p>
<p>2. Khán giả cần xuất trình vé (bản cứng hoặc bản mềm) khi vào cổng.</p>
<p>3. Ban tổ chức có quyền từ chối phục vụ khán giả có hành vi gây rối trật tự.</p>
<p>4. Cấm mang đồ ăn, thức uống, máy quay chuyên nghiệp vào khu vực sân khấu.</p>
<p>5. Ban tổ chức không chịu trách nhiệm về tài sản thất lạc trong sự kiện.</p>`,
  tags: ["music", "festival", "live-music", "ha-noi", "ravolution"],
  followerCount: 45200,
  lowestPrice: 500000,
  performerName: "Various Artists",
  status: EventStatus.ON_SALE,
  socialLinks: {
    facebook: "https://facebook.com/ravolution",
    website: "https://ravolution.vn",
  },
  relatedEvents: mockEvents.slice(0, 4),
};

export const mockEventDetailTheater: EventDetail = {
  ...mockEventDetail,
  id: "2",
  slug: "phantom-of-the-opera-2026",
  title: "The Phantom of the Opera",
  subtitle: "Vở nhạc kịch kinh điển trở lại Hà Nội",
  seatMapType: "theater",
  lowestPrice: 400000,
  relatedEvents: mockEvents.slice(0, 4),
};

export const mockEventDetailZone: EventDetail = {
  ...mockEventDetail,
  id: "3",
  slug: "underground-rave-2026",
  title: "Underground Rave Night 2026",
  subtitle: "General admission — no assigned seats",
  seatMapType: "zone",
  lowestPrice: 799000,
  relatedEvents: mockEvents.slice(0, 4),
};
