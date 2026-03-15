import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { mockListings } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  Share2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Shield,
  BadgeCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Car,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const CarDetail = () => {
  const { id } = useParams();
  const car = mockListings.find((c) => c.id === id);
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-32 text-center">
          <Car className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Vehicle Not Found</h1>
          <p className="mt-2 text-muted-foreground">This listing may have been removed or sold.</p>
          <Link to="/browse">
            <Button className="mt-6 gradient-primary border-0">Browse All Cars</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-primary">Browse</Link>
          <span>/</span>
          <span className="text-foreground">{car.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative overflow-hidden rounded-2xl">
              <motion.img
                key={currentImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={car.images[currentImage]}
                alt={car.title}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />

              {car.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => setCurrentImage((p) => (p === 0 ? car.images.length - 1 : p - 1))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => setCurrentImage((p) => (p === car.images.length - 1 ? 0 : p + 1))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              <div className="absolute left-3 top-3 flex gap-2">
                {car.featured && (
                  <Badge className="gradient-primary border-0 text-primary-foreground">Featured</Badge>
                )}
                {car.verified && (
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                    <BadgeCheck className="mr-1 h-3 w-3 text-success" /> Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="mt-3 flex gap-2">
              {car.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`h-16 w-24 overflow-hidden rounded-lg border-2 transition-all ${
                    i === currentImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Title & Price (mobile) */}
            <div className="mt-6 lg:hidden">
              <h1 className="font-display text-2xl font-bold text-foreground">{car.title}</h1>
              <p className="mt-2 font-display text-3xl font-bold text-primary">
                ${car.price.toLocaleString()}
              </p>
            </div>

            {/* Specs Grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Calendar, label: "Year", value: car.year },
                { icon: Gauge, label: "Mileage", value: `${car.mileage.toLocaleString()} mi` },
                { icon: Fuel, label: "Fuel", value: car.fuelType },
                { icon: Settings2, label: "Transmission", value: car.transmission },
              ].map((spec) => (
                <div key={spec.label} className="rounded-xl border border-border bg-card p-4">
                  <spec.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-xs text-muted-foreground">{spec.label}</p>
                  <p className="font-display font-semibold text-card-foreground">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Technical Specs */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">Technical Specifications</h2>
              <div className="mt-4 grid grid-cols-2 gap-y-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
                {[
                  { label: "Engine", value: car.specs.engine },
                  { label: "Power", value: car.specs.power },
                  { label: "Drivetrain", value: car.specs.drivetrain },
                  { label: "Body Type", value: car.bodyType },
                  { label: "Doors", value: car.specs.doors },
                  { label: "Seats", value: car.specs.seats },
                  { label: "Color", value: car.color },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-card-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">Description</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{car.description}</p>
            </div>

            {/* Checks */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-foreground">Vehicle Checks</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="justify-start gap-2 border-success/30 bg-success/5 text-success hover:bg-success/10">
                  <Shield className="h-4 w-4" />
                  Check Finance Status
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Button>
                <Button variant="outline" className="justify-start gap-2 border-info/30 bg-info/5 text-info hover:bg-info/10">
                  <FileCheck className="h-4 w-4" />
                  Full History Report
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Button>
                <Button variant="outline" className="justify-start gap-2 border-warning/30 bg-warning/5 text-warning hover:bg-warning/10">
                  <AlertTriangle className="h-4 w-4" />
                  Stolen Vehicle Check
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Button>
                <Button variant="outline" className="justify-start gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10">
                  <Car className="h-4 w-4" />
                  MOT History
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Price Card (desktop) */}
              <div className="hidden rounded-2xl border border-border bg-card p-6 shadow-card lg:block">
                <h1 className="font-display text-xl font-bold text-card-foreground">{car.title}</h1>
                <p className="mt-3 font-display text-3xl font-bold text-primary">
                  ${car.price.toLocaleString()}
                </p>
                {car.financeAvailable && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Finance from ~${ Math.round(car.price / 48).toLocaleString()}/mo
                  </p>
                )}
              </div>

              {/* Seller Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-card-foreground">{car.sellerName}</p>
                    <Badge variant={car.sellerType === "dealer" ? "default" : "outline"} className="text-xs">
                      {car.sellerType === "dealer" ? "Verified Dealer" : "Private Seller"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {car.location}
                </div>

                <div className="mt-5 space-y-2">
                  <Button className="w-full gradient-primary border-0">
                    <Phone className="mr-2 h-4 w-4" />
                    Show Phone Number
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setLiked(!liked)}
                  >
                    <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-accent text-accent" : ""}`} />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Share2 className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Safety Tips */}
              <div className="rounded-2xl border border-border bg-warning/5 p-5">
                <h4 className="flex items-center gap-2 font-display font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-warning" />
                  Safety Tips
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Always inspect the car in person</li>
                  <li>• Run a finance and history check</li>
                  <li>• Never pay before seeing the car</li>
                  <li>• Use secure payment methods</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Need to import FileCheck for the button
import { FileCheck } from "lucide-react";

export default CarDetail;
