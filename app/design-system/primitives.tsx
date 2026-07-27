"use client";

import * as React from "react";
import { Bookmark, Info, Search, TriangleAlert } from "lucide-react";

import { Section } from "./foundations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MarketFigure } from "@/components/margin/meta";

/**
 * The shadcn primitives, re-skinned by the token layer.
 *
 * Nothing here is customised per instance. Every one of these is stock
 * shadcn markup picking up `--primary`, `--muted`, `--ring` and the rest —
 * which is the whole argument for owning the components rather than
 * installing a library: the tokens actually reach them.
 */

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <code className="font-mono text-[11px] text-muted-foreground">{label}</code>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  );
}

function PrimitivesShowcase() {
  const [sliderValue, setSliderValue] = React.useState([40]);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-16">
        <Section
          id="actions"
          title="Actions"
          hint="Buttons carry a one-pixel press on click — the cheapest possible acknowledgement that something was received."
        >
          <div className="flex flex-col gap-6">
            <Row label="variant">
              <Button>Continue</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Delete account</Button>
              <Button variant="link">Link</Button>
            </Row>
            <Row label="size">
              <Button size="xs">Extra small</Button>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Bookmark">
                <Bookmark />
              </Button>
            </Row>
            <Row label="state">
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled outline
              </Button>
            </Row>
            <Row label="badge">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </Row>
          </div>
        </Section>

        <Section
          id="forms"
          title="Forms"
          hint="Focus is a three-pixel ring in --ring, never a browser default and never removed."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-5">
              <Field>
                <FieldLabel htmlFor="ds-email">Email</FieldLabel>
                <Input id="ds-email" type="email" placeholder="you@example.com" />
                <FieldDescription>
                  We send one email a week, and you can stop it in one click.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="ds-search">Search</FieldLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input id="ds-search" className="pl-8" placeholder="Candlestick" />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="ds-note">Note</FieldLabel>
                <Textarea
                  id="ds-note"
                  rows={3}
                  placeholder="What did you take away from this lesson?"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="ds-locale">Language</FieldLabel>
                <Select defaultValue="fr">
                  <SelectTrigger id="ds-locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <Checkbox id="ds-check" defaultChecked />
                  <Label htmlFor="ds-check">Email me when a course is added</Label>
                </div>
                <div className="flex items-center gap-2.5">
                  <Switch id="ds-switch" defaultChecked />
                  <Label htmlFor="ds-switch">Reduce motion</Label>
                </div>
              </div>

              <Separator />

              <RadioGroup defaultValue="system" className="flex flex-col gap-2.5">
                {[
                  ["light", "Light"],
                  ["dark", "Dark"],
                  ["system", "Follow the system"],
                ].map(([value, label]) => (
                  <div key={value} className="flex items-center gap-2.5">
                    <RadioGroupItem value={value} id={`ds-theme-${value}`} />
                    <Label htmlFor={`ds-theme-${value}`}>{label}</Label>
                  </div>
                ))}
              </RadioGroup>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="ds-slider">Reading width</Label>
                  <span
                    data-numeric
                    className="font-mono text-xs text-muted-foreground"
                  >
                    {sliderValue[0]}
                  </span>
                </div>
                <Slider
                  id="ds-slider"
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="overlays"
          title="Overlays and navigation"
          hint="All of these enter and leave on --duration-base with --ease-quiet, and stop entirely under reduced motion."
        >
          <div className="flex flex-col gap-8">
            <Row label="dialog · dropdown · tooltip">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete your account</DialogTitle>
                    <DialogDescription>
                      This erases your progress, your notes and your subscription
                      record. It cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Keep my account</Button>
                    </DialogClose>
                    <Button variant="destructive">Delete everything</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Language</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>Resume at chapter 2, lesson 1</TooltipContent>
              </Tooltip>
            </Row>

            <div>
              <code className="mb-2.5 block font-mono text-[11px] text-muted-foreground">
                tabs
              </code>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="pt-4">
                  <p className="measure-prose text-prose-sm text-muted-foreground">
                    What the course covers, who it is for, and what you will be
                    able to do at the end of it.
                  </p>
                </TabsContent>
                <TabsContent value="curriculum" className="pt-4">
                  <p className="measure-prose text-prose-sm text-muted-foreground">
                    Every chapter and lesson, with what is free and what is not.
                  </p>
                </TabsContent>
                <TabsContent value="notes" className="pt-4">
                  <p className="measure-prose text-prose-sm text-muted-foreground">
                    Anything you wrote down while reading.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </Section>

        <Section
          id="feedback"
          title="Feedback and data"
          hint="The alert tones map to the same status roles the lesson callouts use, so a warning looks the same wherever it appears."
        >
          <div className="flex flex-col gap-6">
            <div className="measure-wide flex flex-col gap-3">
              <Alert>
                <Info />
                <AlertTitle>Published in French only</AlertTitle>
                <AlertDescription>
                  The English translation of this lesson is still being written.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>We could not load your progress</AlertTitle>
                <AlertDescription>
                  Your place is saved. Reload to try again.
                </AlertDescription>
              </Alert>
            </div>

            <div className="measure-wide rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Last</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { s: "EURUSD", v: "1.0918", c: "+0.49%", d: "up" as const },
                    { s: "GBPUSD", v: "1.2734", c: "−0.21%", d: "down" as const },
                    { s: "USDJPY", v: "151.42", c: "0.00%", d: "flat" as const },
                  ].map((row) => (
                    <TableRow key={row.s}>
                      <TableCell className="font-mono text-xs">{row.s}</TableCell>
                      <TableCell>
                        <span data-numeric className="font-mono text-sm">
                          {row.v}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <MarketFigure value="" change={row.c} direction={row.d} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Section>
      </div>
    </TooltipProvider>
  );
}

export { PrimitivesShowcase };
